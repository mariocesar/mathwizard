// Comprobación post-build del PWA: caza la clase de fallo "cambié la base o
// el manifest y rompí la instalación" mecánicamente, en CI, antes de desplegar.
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const BASE = '/mathwizard/';
const root = new URL('..', import.meta.url).pathname;
const dist = path.join(root, 'dist');

const failures = [];
const ok = (msg) => console.log(`✓ ${msg}`);
const fail = (msg) => failures.push(msg);

async function exists(rel) {
  try {
    await access(path.join(dist, rel));
    return true;
  } catch {
    return false;
  }
}

// index.html existe y sus assets cuelgan de la base
if (await exists('index.html')) {
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const external = srcs.filter((s) => !s.startsWith(BASE) && !s.startsWith('http'));
  if (external.length > 0) {
    fail(`index.html referencia assets fuera de ${BASE}: ${external.join(', ')}`);
  } else {
    ok(`index.html y todos sus assets cuelgan de ${BASE}`);
  }
} else {
  fail('dist/index.html no existe');
}

// manifest válido y anclado a la base
if (await exists('manifest.webmanifest')) {
  const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'));
  if (manifest.scope !== BASE) fail(`manifest.scope es "${manifest.scope}", esperaba "${BASE}"`);
  if (manifest.start_url !== BASE)
    fail(`manifest.start_url es "${manifest.start_url}", esperaba "${BASE}"`);
  for (const icon of manifest.icons ?? []) {
    if (!(await exists(icon.src))) fail(`icono del manifest ausente en dist: ${icon.src}`);
  }
  if (failures.length === 0) ok('manifest.webmanifest: scope, start_url e iconos correctos');
} else {
  fail('dist/manifest.webmanifest no existe');
}

// service worker con index.html en el precache
if (await exists('sw.js')) {
  const sw = await readFile(path.join(dist, 'sw.js'), 'utf8');
  if (!sw.includes('index.html')) fail('sw.js no incluye index.html en el precache');
  else ok('sw.js precachea index.html');
} else {
  fail('dist/sw.js no existe');
}

if (failures.length > 0) {
  console.error('\nFallos de verificación:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\ndist verificado: listo para desplegar.');
