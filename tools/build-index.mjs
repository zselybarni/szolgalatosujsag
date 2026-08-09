/**
 * Cikkjegyzék-készítő.
 *
 * A statikus tárhely nem tud könyvtárat listázni, ezért a böngésző önmagában
 * sosem tudná meg, milyen .md fájlok vannak a repóban. Ez a szkript végigmegy
 * a `content/cikkek` mappán, kiolvassa a fejléceket, és `content/index.json`
 * néven leteszi a jegyzéket – ezt tölti be a kliens induláskor.
 *
 * Két helyen nyúl hozzá a cikkekhez is:
 *   – ha nincs lead a fejlécben, az első bekezdésből készít egyet;
 *   – a leadet kiegyenlített sorokra tördelve írja vissza a fájlba.
 *
 * Futtatás:  npm run index
 * A közzétételkor a GitHub Actions is lefuttatja, így elég egy .md fájlt
 * beküldeni: a jegyzék magától frissül.
 */

import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname, basename, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { frontmatterBont } from '../assets/js/frontmatter.js';
import { leadSzarmaztat, leadTordel } from '../assets/js/lead.js';

const GYOKER = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CIKK_MAPPA = join(GYOKER, 'content', 'cikkek');
const KIMENET = join(GYOKER, 'content', 'index.json');
const SZO_PER_PERC = 200;

/** Beágyazott képek a cikk törzsében – Markdown és nyers HTML alakban is. */
const KEP_MINTAK = [
  /!\[[^\]]*\]\(\s*([^)\s]+)/g,
  /<img[^>]+src\s*=\s*["']([^"']+)["']/gi,
];

const hibak = [];
const atirtFajlok = [];

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

for (const fajl of atirtFajlok) console.log(`  ↻ lead formázva: ${fajl}`);
console.log(`✓ content/index.json elkészült – ${cikkek.length} cikk.`);

/* ------------------------------------------------------------------------ */

async function feldolgoz(fajl) {
  const utvonal = join(CIKK_MAPPA, fajl);
  const nyers = await readFile(utvonal, 'utf8');
  const { adat, torzs } = frontmatterBont(nyers);

  const slug = basename(fajl, '.md');
  const title = kotelezo(adat, 'title');
  const date = datumEllenor(adat.date ?? datumFajlnevbol(fajl));

  if (adat.cover) await kepEllenor(String(adat.cover));
  await beagyazottKepekEllenor(torzs);

  // Lead: a kézzel írté az elsőbbség, különben az első bekezdésből készül.
  const lead = (typeof adat.lead === 'string' && adat.lead.trim())
    ? adat.lead.trim().replace(/\s+/g, ' ')
    : leadSzarmaztat(torzs);

  if (lead) {
    const ujTartalom = leadVisszair(nyers, lead);
    if (ujTartalom) {
      await writeFile(utvonal, ujTartalom, 'utf8');
      atirtFajlok.push(fajl);
    }
  }

  return {
    slug,
    path: posix.join('content', 'cikkek', fajl),
    title,
    date,
    lead: lead || null,
    author: adat.author ?? null,
    section: adat.section ?? null,
    tags: tombbe(adat.tags),
    cover: adat.cover ?? null,
    coverAlt: adat.coverAlt ?? null,
    featured: adat.featured === true,
    readingMinutes: Math.max(1, Math.round(szoSzam(torzs) / SZO_PER_PERC)),
  };
}

/**
 * A leadet `>` blokként, kiegyenlített sorokban írja vissza a fejlécbe.
 * @returns {string|null} az új fájltartalom, vagy null, ha nem változott
 */
function leadVisszair(nyers, lead) {
  const ujsor = nyers.includes('\r\n') ? '\r\n' : '\n';
  const sorok = nyers.split(/\r?\n/);
  if (sorok[0].trim() !== '---') return null;

  const zaro = sorok.findIndex((sor, i) => i > 0 && sor.trim() === '---');
  if (zaro === -1) return null;

  const blokk = ['lead: >', ...leadTordel(lead).map((sor) => `  ${sor}`)];
  const meglevo = sorok.findIndex((sor, i) => i > 0 && i < zaro && /^lead\s*:/.test(sor));

  if (meglevo !== -1) {
    // A kulcs sorát és a hozzá tartozó behúzott folytatást cseréljük.
    let vege = meglevo + 1;
    while (vege < zaro && (sorok[vege].trim() === '' || /^\s{2,}\S/.test(sorok[vege]))) vege += 1;
    sorok.splice(meglevo, vege - meglevo, ...blokk);
  } else {
    const datumSor = sorok.findIndex((sor, i) => i > 0 && i < zaro && /^date\s*:/.test(sor));
    sorok.splice(datumSor === -1 ? zaro : datumSor + 1, 0, ...blokk);
  }

  const ujTartalom = sorok.join(ujsor);
  return ujTartalom === nyers ? null : ujTartalom;
}

function kotelezo(adat, kulcs) {
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

async function beagyazottKepekEllenor(torzs) {
  for (const minta of KEP_MINTAK) {
    for (const talalat of torzs.matchAll(minta)) {
      await kepEllenor(talalat[1]);
    }
  }
}

/**
 * A képútvonalakat a lap gyökeréhez képest kell megadni, mert a böngésző az
 * `index.html` címéhez viszonyít, nem a Markdown fájléhoz.
 */
async function kepEllenor(nyersUtvonal) {
  const utvonal = nyersUtvonal.trim().replace(/^["']|["']$/g, '');
  if (!utvonal || /^(https?:)?\/\//i.test(utvonal) || /^(data|mailto):/i.test(utvonal)) return;

  if (utvonal.startsWith('/')) {
    throw new Error(`a képútvonal abszolút, a projektoldalon eltörik: ${utvonal}`);
  }
  if (utvonal.includes('../')) {
    throw new Error(`a képútvonal a cikkhez képest relatív; a lap gyökeréhez képest add meg: ${utvonal}`);
  }

  try {
    await access(join(GYOKER, utvonal.replace(/^\.\//, '')));
  } catch {
    throw new Error(`a kép nem található: ${utvonal}`);
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
