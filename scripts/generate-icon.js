/**
 * Generates a simple icon.ico for the Thai Lotto Predictor.
 * Creates a 32x32 PNG icon with a lottery-ball design and embeds it in ICO format.
 */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const SIZE = 32;
const cx = SIZE / 2;
const cy = SIZE / 2;
const radius = 13;

// Create raw RGBA pixel data (filter byte per row + RGBAlpha)
const rawData = Buffer.alloc(SIZE * (1 + SIZE * 4), 0);

for (let y = 0; y < SIZE; y++) {
  const rowOffset = y * (1 + SIZE * 4);
  rawData[rowOffset] = 0; // filter byte: None

  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const pixelOffset = rowOffset + 1 + x * 4;

    // Background: dark blue gradient (#111827)
    const bgBrightness = 1 - (y / SIZE) * 0.3;
    rawData[pixelOffset] = Math.round(17 * bgBrightness);     // R
    rawData[pixelOffset + 1] = Math.round(24 * bgBrightness); // G
    rawData[pixelOffset + 2] = Math.round(39 * bgBrightness); // B
    rawData[pixelOffset + 3] = 255;                            // A

    if (dist <= radius) {
      // Ball circle - blue gradient (#2563eb)
      const shade = 1 - (dist / radius) * 0.25;
      rawData[pixelOffset] = Math.round(37 * shade);
      rawData[pixelOffset + 1] = Math.round(99 * shade);
      rawData[pixelOffset + 2] = Math.round(235 * shade);
      rawData[pixelOffset + 3] = 255;

      // Highlight (top-left shine)
      if (dist < radius * 0.5 && dx < 0 && dy < 0) {
        rawData[pixelOffset] = Math.min(255, rawData[pixelOffset] + 60);
        rawData[pixelOffset + 1] = Math.min(255, rawData[pixelOffset + 1] + 60);
        rawData[pixelOffset + 2] = Math.min(255, rawData[pixelOffset + 2] + 60);
      }
    }

    // Draw number "6" in white
    if (dist <= radius - 2) {
      const isIn6 = isDigit6(x, y, cx, cy);
      if (isIn6) {
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }
}

function isDigit6(px, py, cx, cy) {
  // Convert to relative coordinates centered on ball
  const rx = px - cx;
  const ry = py - cy;

  // Digit "6" drawn as a simple bitmap character
  // Scale to a 9x13 grid
  const gx = Math.round((rx + 6) / 1.1);
  const gy = Math.round((ry + 7) / 1.1);

  // "6" character bitmap (14 rows x 10 cols)
  const bitmap6 = [
    [0,0,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,0,0],
    [1,1,1,0,0,0,1,1,1,0],
    [1,1,0,0,0,0,0,1,1,0],
    [1,1,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,1,1,0],
    [0,1,0,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,1,0],
    [1,1,1,0,0,1,1,1,0,0],
    [0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ];

  if (gy >= 0 && gy < bitmap6.length && gx >= 0 && gx < bitmap6[0].length) {
    return bitmap6[gy][gx] === 1;
  }
  return false;
}

// Build PNG
function createPNG(width, height, rawData) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = Buffer.concat([
    Buffer.alloc(4), // length placeholder
    Buffer.from("IHDR"),
    ihdrData,
    Buffer.alloc(4)  // CRC placeholder
  ]);
  ihdr.writeUInt32BE(13, 0); // IHDR data length
  // CRC over type + data
  const crc32IHDR = crc32(Buffer.concat([Buffer.from("IHDR"), ihdrData]));
  ihdr.writeUInt32BE(crc32IHDR, ihdr.length - 4);

  // IDAT chunk - compress raw data with zlib
  const compressed = zlib.deflateSync(rawData);
  const idat = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from("IDAT"),
    compressed,
    Buffer.alloc(4)
  ]);
  idat.writeUInt32BE(compressed.length, 0);
  const crc32IDAT = crc32(Buffer.concat([Buffer.from("IDAT"), compressed]));
  idat.writeUInt32BE(crc32IDAT, idat.length - 4);

  // IEND chunk
  const iend = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from("IEND"),
    Buffer.alloc(4)
  ]);
  iend.writeUInt32BE(0, 0);
  const crc32IEND = crc32(Buffer.from("IEND"));
  iend.writeUInt32BE(crc32IEND, iend.length - 4);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc >>>= 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create PNG
const pngData = createPNG(SIZE, SIZE, rawData);

// Build ICO container
const imageCount = 1;
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);     // reserved
icoHeader.writeUInt16LE(1, 2);     // type: 1 = ICO
icoHeader.writeUInt16LE(imageCount, 4);

// Directory entry
const dirEntry = Buffer.alloc(16);
dirEntry[0] = SIZE >= 256 ? 0 : SIZE;  // width
dirEntry[1] = SIZE >= 256 ? 0 : SIZE;  // height
dirEntry[2] = 0;                       // colors
dirEntry[3] = 0;                       // reserved
dirEntry.writeUInt16LE(1, 4);          // color planes
dirEntry.writeUInt16LE(32, 6);         // bits per pixel
const imageOffset = 6 + imageCount * 16;
dirEntry.writeUInt32LE(pngData.length, 8);  // image size
dirEntry.writeUInt32LE(imageOffset, 12);     // offset in file

const ico = Buffer.concat([icoHeader, dirEntry, pngData]);

const outputPath = path.join(__dirname, "..", "public", "icon.ico");
fs.writeFileSync(outputPath, ico);
console.log(`icon.ico created at ${outputPath} (${ico.length} bytes)`);
