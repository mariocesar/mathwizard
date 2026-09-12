// Genera los iconos instalables desde el arte original de Math Wizard.
// Uso: bun run icons (los PNG se commitean; no forma parte del build).
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const artwork = await readFile(path.join(root, 'scripts/assets/icon-master.png'));
const maskableArtwork = await readFile(path.join(root, 'scripts/assets/icon-maskable-master.png'));
const outDir = path.join(root, 'public/icons');
await mkdir(outDir, { recursive: true });

const targets = [
  { file: 'pwa-192.png', size: 192, input: artwork },
  { file: 'pwa-512.png', size: 512, input: artwork },
  { file: 'maskable-512.png', size: 512, input: maskableArtwork },
  { file: 'apple-touch-icon.png', size: 180, input: artwork },
];

for (const { file, size, input } of targets) {
  await sharp(input).resize(size, size).png().toFile(path.join(outDir, file));
  console.log(`✓ icons/${file}`);
}

// La pestaña del navegador necesita una silueta más cercana que el icono instalable.
await sharp(artwork)
  .extract({ left: 370, top: 310, width: 520, height: 520 })
  .resize(64, 64)
  .png()
  .toFile(path.join(root, 'public/favicon.png'));
console.log('✓ favicon.png');
