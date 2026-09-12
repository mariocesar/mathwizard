// Rasteriza public/favicon.svg a los PNG que pide el manifest PWA.
// Uso: pnpm icons  (los PNG se commitean; no forma parte del build)
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const svg = await readFile(path.join(root, 'public/favicon.svg'));
const outDir = path.join(root, 'public/icons');
await mkdir(outDir, { recursive: true });

const targets = [
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, flat: true },
];

for (const { file, size, maskable, flat } of targets) {
  let img;
  if (maskable) {
    // Zona segura maskable: el contenido ocupa el 80% sobre fondo de vitela a sangre.
    const inner = Math.round(size * 0.8);
    const pad = Math.round((size - inner) / 2);
    img = sharp({
      create: { width: size, height: size, channels: 4, background: '#faf5ec' },
    }).composite([
      { input: await sharp(svg).resize(inner, inner).png().toBuffer(), top: pad, left: pad },
    ]);
  } else if (flat) {
    // iOS aplica sus propias esquinas: fondo a sangre, sin transparencia.
    img = sharp({
      create: { width: size, height: size, channels: 4, background: '#faf5ec' },
    }).composite([
      { input: await sharp(svg).resize(size, size).png().toBuffer(), top: 0, left: 0 },
    ]);
  } else {
    img = sharp(svg).resize(size, size);
  }
  await img.png().toFile(path.join(outDir, file));
  console.log(`✓ icons/${file}`);
}
