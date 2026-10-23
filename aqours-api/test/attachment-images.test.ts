import assert from "node:assert/strict";
import { test } from "node:test";
import { Jimp } from "jimp";
import { processImage } from "../src/services/attachments/process-image.js";
import { inspectImageHeader } from "../src/services/attachments/image-header.js";
import { Fault } from "../src/utils/errors.js";

const image = () => new Jimp({ width: 2, height: 3, color: 0x35aabbff });
const invalidImage = (error: unknown) =>
  error instanceof Fault && error.status === 415 && error.code === "image_type";

function jpegSegment(marker: number, data: Buffer) {
  const header = Buffer.from([0xff, marker, 0, 0]);
  header.writeUInt16BE(data.length + 2, 2);
  return Buffer.concat([header, data]);
}

function pngChunk(type: string, data: Buffer) {
  const content = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of content) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4),
    checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, content, checksum]);
}

test("pure JavaScript JPEG/PNG processing produces decodable images on older CPUs", async () => {
  for (const mediaType of ["image/jpeg", "image/png"] as const) {
    const input = await image().getBuffer(mediaType);
    const output = await processImage(input);
    assert.equal(output.mediaType, mediaType);
    const decoded = await Jimp.fromBuffer(output.bytes);
    assert.equal(decoded.width, 2);
    assert.equal(decoded.height, 3);
  }
});

test("JPEG processing applies EXIF orientation and removes EXIF and comments", async () => {
  const input = await image().getBuffer("image/jpeg");
  const exif = Buffer.from(
    "4578696600004d4d002a00000008000101120003000000010006000000000000",
    "hex",
  );
  const privateNote = Buffer.from("Private location fixture");
  const tagged = Buffer.concat([
    input.subarray(0, 2),
    jpegSegment(0xe1, exif),
    jpegSegment(0xfe, privateNote),
    input.subarray(2),
  ]);
  const { bytes } = await processImage(tagged);
  const decoded = await Jimp.fromBuffer(bytes);
  assert.equal(decoded.width, 3);
  assert.equal(decoded.height, 2);
  assert.equal(bytes.includes(Buffer.from("Exif")), false);
  assert.equal(bytes.includes(privateNote), false);
});

test("PNG processing strips text metadata and rejects animation", async () => {
  const input = await image().getBuffer("image/png");
  const privateNote = Buffer.from("Location\0Private location fixture");
  const tagged = Buffer.concat([
    input.subarray(0, 33),
    pngChunk("tEXt", privateNote),
    input.subarray(33),
  ]);
  const { bytes } = await processImage(tagged);
  assert.equal(bytes.includes(Buffer.from("Private location fixture")), false);
  const animated = Buffer.concat([
    input.subarray(0, 33),
    pngChunk("acTL", Buffer.from([0, 0, 0, 2, 0, 0, 0, 0])),
    input.subarray(33),
  ]);
  await assert.rejects(processImage(animated), invalidImage);
});

test("uploads reject unsupported formats, corrupt bytes and oversized input", async () => {
  for (const input of [
    Buffer.from("not an image"),
    Buffer.from("GIF89a"),
    Buffer.from("RIFF0000WEBPVP8 "),
    Buffer.from([0xff, 0xd8, 0xff]),
    (await image().getBuffer("image/png")).subarray(0, 40),
  ])
    await assert.rejects(processImage(input), invalidImage);
  await assert.rejects(
    processImage(Buffer.alloc(5 * 1024 * 1024 + 1)),
    (error: unknown) => error instanceof Fault && error.status === 413,
  );
});

test("dimensions are bounded before decoding and malformed chunk headers are rejected", async () => {
  const png = await image().getBuffer("image/png");
  const oversized = Buffer.from(png);
  oversized.writeUInt32BE(25000001, 16);
  assert.throws(() => inspectImageHeader(oversized), /pixel limit/);
  await assert.rejects(processImage(oversized), invalidImage);
  const duplicate = Buffer.concat([png.subarray(0, 33), png.subarray(8)]);
  assert.throws(() => inspectImageHeader(duplicate), /Duplicate/);
  const truncated = Buffer.from(png);
  truncated.writeUInt32BE(0xffffffff, 33);
  assert.throws(() => inspectImageHeader(truncated), /Truncated/);
  const hugeJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0, 8, 8, 0xff, 0xff, 0xff, 0xff, 1,
  ]);
  assert.throws(() => inspectImageHeader(hugeJpeg), /pixel limit/);
});
