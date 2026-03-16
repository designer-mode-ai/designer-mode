/**
 * Generates simple PNG icon files for the extension.
 * Uses a canvas-like approach with raw PNG data.
 * Run: node scripts/generate-icons.js
 */
const { writeFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const iconsDir = resolve(root, 'icons');
mkdirSync(iconsDir, { recursive: true });

// Minimal PNG encoder — creates a solid-color square with a centered "D" shape
function createPNG(size) {
  // We'll create a simple icon: blue (#037DD6) rounded square with white "D"
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45; // radius for rounded square

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      // Rounded rect check
      const cornerR = size * 0.2;
      let inside = false;
      if (dx <= r - cornerR || dy <= r - cornerR) {
        inside = true;
      } else if (dx <= r && dy <= r) {
        const cdx = dx - (r - cornerR);
        const cdy = dy - (r - cornerR);
        inside = Math.sqrt(cdx * cdx + cdy * cdy) <= cornerR;
      }

      if (inside) {
        // Check if pixel is part of the "D" letter
        const nx = (x - (cx - r)) / (2 * r); // 0..1 within icon
        const ny = (y - (cy - r)) / (2 * r);

        let isLetter = false;

        // "D" shape: left bar + right arc
        if (nx >= 0.28 && nx <= 0.38 && ny >= 0.25 && ny <= 0.75) {
          isLetter = true; // vertical bar
        }
        // Top horizontal
        if (nx >= 0.28 && nx <= 0.55 && ny >= 0.25 && ny <= 0.33) {
          isLetter = true;
        }
        // Bottom horizontal
        if (nx >= 0.28 && nx <= 0.55 && ny >= 0.67 && ny <= 0.75) {
          isLetter = true;
        }
        // Right arc
        const arcCx = 0.50;
        const arcCy = 0.50;
        const arcR = 0.25;
        const adx = nx - arcCx;
        const ady = ny - arcCy;
        const dist = Math.sqrt(adx * adx + ady * ady);
        if (nx >= 0.45 && dist >= arcR - 0.06 && dist <= arcR + 0.02 && ny >= 0.28 && ny <= 0.72) {
          isLetter = true;
        }

        if (isLetter) {
          // White
          pixels[i] = 255;
          pixels[i + 1] = 255;
          pixels[i + 2] = 255;
          pixels[i + 3] = 255;
        } else {
          // Blue #037DD6
          pixels[i] = 3;
          pixels[i + 1] = 125;
          pixels[i + 2] = 214;
          pixels[i + 3] = 255;
        }
      } else {
        // Transparent
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
        pixels[i + 3] = 0;
      }
    }
  }

  return encodePNG(size, size, pixels);
}

// Minimal PNG encoder
function encodePNG(width, height, pixels) {
  const { deflateSync } = require('node:zlib');

  // Add filter byte (0 = None) to each row
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: None
    pixels.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = deflateSync(raw);

  const chunks = [];

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdr));

  // IDAT
  chunks.push(makeChunk('IDAT', compressed));

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

for (const size of [16, 32, 48, 128]) {
  const png = createPNG(size);
  writeFileSync(resolve(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png`);
}
