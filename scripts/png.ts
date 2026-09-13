import { deflateSync } from 'node:zlib';

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(value: number): Uint8Array {
  return Uint8Array.of(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  );
}

function concat(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const body = concat([typeBytes, data]);
  return concat([u32(data.length), body, u32(crc32(body))]);
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  if (rgba.length !== width * height * 4) {
    throw new Error('RGBA buffer size does not match width and height');
  }

  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const dest = y * (stride + 1);
    raw[dest] = 0;
    raw.set(rgba.subarray(y * stride, y * stride + stride), dest + 1);
  }

  const ihdr = concat([
    u32(width),
    u32(height),
    Uint8Array.of(8, 6, 0, 0, 0),
  ]);

  const signature = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  return concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ]);
}

export type Rgba = readonly [number, number, number, number];

export function fillRect(
  rgba: Uint8Array,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgba,
  radius = 0,
): void {
  const left = Math.max(0, Math.floor(x0));
  const top = Math.max(0, Math.floor(y0));
  const right = Math.min(width, Math.ceil(x1));
  const height = rgba.length / 4 / width;
  const bottom = Math.min(height, Math.ceil(y1));
  const r = Math.max(0, radius);

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      if (r > 0 && !inRoundedRect(x + 0.5, y + 0.5, x0, y0, x1, y1, r)) {
        continue;
      }
      const i = (y * width + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = color[3];
    }
  }
}

function inRoundedRect(
  x: number,
  y: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
): boolean {
  const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
  const innerLeft = x0 + r;
  const innerRight = x1 - r;
  const innerTop = y0 + r;
  const innerBottom = y1 - r;

  if (x >= innerLeft && x <= innerRight) return y >= y0 && y <= y1;
  if (y >= innerTop && y <= innerBottom) return x >= x0 && x <= x1;

  const cx = x < innerLeft ? innerLeft : innerRight;
  const cy = y < innerTop ? innerTop : innerBottom;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
