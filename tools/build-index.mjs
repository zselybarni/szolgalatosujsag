/**
 * Cikkjegyzék-készítő.
 *
 * A statikus tárhely nem tud könyvtárat listázni, ezért a böngésző önmagában
 * sosem tudná meg, milyen .md fájlok vannak a repóban. Ez a szkript végigmegy
 * a `content/cikkek` mappán, kiolvassa a fejléceket, és `content/index.json`
 * néven leteszi a jegyzéket – ezt tölti be a kliens induláskor.
 *
 * Futtatás:  npm run index
 * A közzétételkor a GitHub Actions is lefuttatja, így elég egy .md fájlt
 * beküldeni: a jegyzék magától frissül.
 */

import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname, basename, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { frontmatterBont } from '../assets/js/frontmatter.js';

const GYOKER = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CIKK_MAPPA = join(GYOKER, 'content', 'cikkek');
const KIMENET = join(GYOKER, 'content', 'index.json');
const SZO_PER_PERC = 200;

const hibak = [];

const fajlok = (await readdir(CIKK_MAPPA)).filter((f) => f.endsWith('.md')).sort();
const cikkek = [];

for (const fajl of fajlok) {
  try {
    cikkek.push(await feldolgoz(fajl));
  } catch (hiba) {
    hibak.push(`${fajl}: ${hiba.message}`);
  }
}

utkozesEllenor(cikkek);

if (hibak.length) {
  console.error('\nA cikkjegyzék nem készült el:\n');
  for (const hiba of hibak) console.error(`  ✗ ${hiba}`);
  console.error('');
  process.exit(1);
}

cikkek.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug, 'hu')));

await writeFile(
  KIMENET,
  `${JSON.stringify({ generalva: new Date().toISOString(), cikkek }, null, 2)}\n`,
  'utf8',
);

console.log(`✓ content/index.json elkészült – ${cikkek.length} cikk.`);

/* ------------------------------------------------------------------------ */

async function feldolgoz(fajl) {
  const nyers = await readFile(join(CIKK_MAPPA, fajl), 'utf8');
  const { adat, torzs } = frontmatterBont(nyers);

  const slug = basename(fajl, '.md');
  const title = kotelezo(adat, 'title', fajl);
  const date = datumEllenor(adat.date ?? datumFajlnevbol(fajl), fajl);

  if (adat.cover) await letezikEllenor(adat.cover, fajl);

  return {
    slug,
    path: posix.join('content', 'cikkek', fajl),
    title,
    date,
    lead: adat.lead ?? null,
    author: adat.author ?? null,
    section: adat.section ?? null,
    tags: tombbe(adat.tags),
    cover: adat.cover ?? null,
    coverAlt: adat.coverAlt ?? null,
    featured: adat.featured === true,
    readingMinutes: Math.max(1, Math.round(szoSzam(torzs) / SZO_PER_PERC)),
  };
}

function kotelezo(adat, kulcs, fajl) {
  const ertek = adat[kulcs];
  if (typeof ertek !== 'string' || !ertek.trim()) {
    throw new Error(`hiányzik vagy üres a kötelező "${kulcs}" mező`);
  }
  return ertek.trim();
}

function datumFajlnevbol(fajl) {
  const talalat = /^(\d{4}-\d{2}-\d{2})/.exec(fajl);
  if (!talalat) {
    throw new Error('nincs "date" mező, és a fájlnév sem ÉÉÉÉ-HH-NN- előtaggal kezdődik');
  }
  return talalat[1];
}

function datumEllenor(ertek) {
  const szoveg = String(ertek);
  if (!/^\d{4}-\d{2}-\d{2}(T[\d:]+)?/.test(szoveg)) {
    throw new Error(`a dátum nem ÉÉÉÉ-HH-NN alakú: ${szoveg}`);
  }
  if (Number.isNaN(new Date(`${szoveg.slice(0, 10)}T12:00:00`).getTime())) {
    throw new Error(`érvénytelen dátum: ${szoveg}`);
  }
  return szoveg.slice(0, 10);
}

async function letezikEllenor(utvonal, fajl) {
  const tiszta = String(utvonal).replace(/^\.\//, '');
  try {
    await access(join(GYOKER, tiszta));
  } catch {
    throw new Error(`a borítókép nem található: ${utvonal}`);
  }
}

function tombbe(ertek) {
  if (ertek === null || ertek === undefined) return [];
  return Array.isArray(ertek) ? ertek.map(String) : [String(ertek)];
}

function szoSzam(torzs) {
  return torzs.split(/\s+/).filter(Boolean).length;
}

function utkozesEllenor(lista) {
  const latott = new Set();
  for (const cikk of lista) {
    if (latott.has(cikk.slug)) hibak.push(`azonos slug kétszer: ${cikk.slug}`);
    latott.add(cikk.slug);
  }
}
