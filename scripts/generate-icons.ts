import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { encodePng, fillRect } from './png.ts';

const NAVY: readonly [number, number, number, number] = [12, 18, 32, 255];
const GOLD: readonly [number, number, number, number] = [224, 179, 76, 255];
const CREAM: readonly [number, number, number, number] = [244, 239, 228, 255];

function drawMark(size: number): Uint8Array {
  const rgba = new Uint8Array(size * size * 4);
  fillRect(rgba, size, 0, 0, size, size, NAVY);

  const inset = size * 0.18;
  const gap = size * 0.035;
  const gridWidth = size - inset * 2;
  const gridHeight = size - inset * 2;
  const cardWidth = (gridWidth - gap * 3) / 4;
  const cardHeight = (gridHeight - gap) / 2;

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = inset + col * (cardWidth + gap);
      const y = inset + row * (cardHeight + gap);
      fillRect(rgba, size, x, y, x + cardWidth, y + cardHeight, GOLD, size * 0.035);
      fillRect(
        rgba,
        size,
        x + cardWidth * 0.18,
        y + cardHeight * 0.16,
        x + cardWidth * 0.82,
        y + cardHeight * 0.84,
        CREAM,
        size * 0.02,
      );
    }
  }

  return encodePng(size, size, rgba);
}

const outDir = path.resolve('public/icons');
await mkdir(outDir, { recursive: true });

await writeFile(path.join(outDir, 'icon-192.png'), drawMark(192));
await writeFile(path.join(outDir, 'icon-512.png'), drawMark(512));
await writeFile(path.join(outDir, 'apple-touch-icon.png'), drawMark(180));

console.log('Wrote PWA icons to public/icons/');
