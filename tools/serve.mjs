/**
 * Pehelysúlyú fejlesztői kiszolgáló. A lap `fetch`-csel tölti be a jegyzéket
 * és a Markdown fájlokat, amit a böngésző `file://` alól nem enged, ezért a
 * helyi próbához kell egy http kiszolgáló.
 *
 * Futtatás:  npm start        (alapértelmezés: http://localhost:4173)
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, extname, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GYOKER = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 4173);

const TIPUSOK = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

createServer(async (keres, valasz) => {
  const utvonal = decodeURIComponent(new URL(keres.url, 'http://localhost').pathname);
  // A ".." lépéseket a normalize kiejti, így a kiszolgálás a repón belül marad.
  const cel = join(GYOKER, normalize(utvonal).replace(/^(\.\.[/\\])+/, ''));
  const fajl = utvonal.endsWith('/') ? join(cel, 'index.html') : cel;

  try {
    const adat = await stat(fajl);
    if (adat.isDirectory()) return kuld(valasz, join(fajl, 'index.html'));
    return kuld(valasz, fajl);
  } catch {
    valasz.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    valasz.end(`Nincs ilyen fájl: ${utvonal}`);
  }
}).listen(PORT, () => {
  console.log(`A lap fut:  http://localhost:${PORT}/`);
});

function kuld(valasz, fajl) {
  valasz.writeHead(200, {
    'Content-Type': TIPUSOK[extname(fajl).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  createReadStream(fajl).pipe(valasz);
}
