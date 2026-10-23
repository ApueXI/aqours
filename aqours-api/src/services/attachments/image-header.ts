const pixelLimit = 25000000;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function dimensions(width: number, height: number) {
  if (!width || !height || width * height > pixelLimit)
    throw new Error("Image exceeds the input pixel limit");
}

/** Check dimensions before allocating decoded pixels; never trust the MIME label. */
export function inspectImageHeader(bytes: Buffer): "image/png" | "image/jpeg" {
  if (bytes.subarray(0, 8).equals(pngSignature)) {
    if (
      bytes.length < 33 ||
      bytes.readUInt32BE(8) !== 13 ||
      bytes.toString("ascii", 12, 16) !== "IHDR"
    )
      throw new Error("Invalid PNG header");
    dimensions(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
    for (let offset = 8; offset < bytes.length; ) {
      if (offset + 12 > bytes.length) throw new Error("Truncated PNG chunk");
      const length = bytes.readUInt32BE(offset);
      const type = bytes.toString("ascii", offset + 4, offset + 8);
      if (type === "IHDR" && offset !== 8)
        throw new Error("Duplicate PNG header");
      if (offset + 12 + length > bytes.length)
        throw new Error("Truncated PNG chunk");
      if (["acTL", "fcTL", "fdAT"].includes(type))
        throw new Error("Animated PNG is unsupported");
      offset += 12 + length;
      if (type === "IEND") {
        if (length || offset !== bytes.length)
          throw new Error("Invalid PNG end");
        return "image/png";
      }
    }
    throw new Error("Missing PNG end");
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error("Choose a JPEG or PNG image");
  // JPEG dimensions reside in a Start Of Frame segment before compressed data.
  for (let offset = 2; offset < bytes.length; ) {
    if (bytes[offset++] !== 0xff) throw new Error("Invalid JPEG marker");
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === undefined || marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) throw new Error("Truncated JPEG segment");
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length)
      throw new Error("Invalid JPEG segment");
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) throw new Error("Invalid JPEG frame");
      dimensions(
        bytes.readUInt16BE(offset + 5),
        bytes.readUInt16BE(offset + 3),
      );
      return "image/jpeg";
    }
    offset += length;
  }
  throw new Error("Missing JPEG dimensions");
}
