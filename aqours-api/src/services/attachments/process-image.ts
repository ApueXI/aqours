import { Jimp } from "jimp";
import { fail } from "../../utils/errors.js";
import { inspectImageHeader } from "./image-header.js";

const byteLimit = 5 * 1024 * 1024;

/** Decode and reencode pixels so uploaded metadata is never persisted. */
export async function processImage(input: Buffer) {
  if (input.length > byteLimit)
    fail(413, "Maximum upload size is 5 MiB", "size");
  let bytes: Buffer;
  let mediaType: "image/jpeg" | "image/png";
  try {
    mediaType = inspectImageHeader(input);
    const image = await Jimp.fromBuffer(input, {
      "image/jpeg": {
        maxResolutionInMP: 25,
        maxMemoryUsageInMB: 256,
        tolerantDecoding: false,
      },
    });
    // Jimp applies EXIF orientation on decode; encoders receive pixels only.
    bytes = await image.getBuffer(mediaType);
  } catch {
    fail(
      415,
      "Choose a valid still JPEG or PNG image up to 25 million pixels; WebP is not supported",
      "image_type",
    );
  }
  if (bytes.length > byteLimit)
    fail(413, "Decoded image exceeds 5 MiB", "size");
  return { bytes, mediaType };
}
