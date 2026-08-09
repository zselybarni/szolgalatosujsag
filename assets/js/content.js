/**
 * A cikkek betöltése. A statikus tárhelyen nincs könyvtárlistázás, ezért a
 * kliens a `content/index.json` jegyzékből tudja, milyen cikkek léteznek –
 * ezt a `tools/build-index.mjs` állítja elő a .md fájlok fejlécéből.
 *
 * A hírfolyam kirajzolásához elég a jegyzék; a Markdown törzs csak akkor
 * töltődik le, amikor az olvasó megnyit egy cikket.
 */

import { UTVONALAK } from './config.js';
import { datum } from './format.js';
import { frontmatterBont } from './frontmatter.js';

let jegyzekIgeret = null;
const torzsCache = new Map();

/** @returns {Promise<{ cikkek: object[] }>} */
export function jegyzekBetolt() {
  if (!jegyzekIgeret) {
    jegyzekIgeret = fetch(UTVONALAK.indexJson, { headers: { Accept: 'application/json' } })
      .then((valasz) => {
        if (!valasz.ok) throw new Error(`A cikkjegyzék nem tölthető be (${valasz.status}).`);
        return valasz.json();
      })
      .then((adat) => ({
        ...adat,
        // A jegyzéket az indexelő már rendezi, de itt is garantáljuk a sorrendet.
        cikkek: [...(adat.cikkek ?? [])].sort(
          (a, b) => datum(b.date) - datum(a.date),
        ),
      }))
      .catch((hiba) => {
        jegyzekIgeret = null;
        throw hiba;
      });
  }
  return jegyzekIgeret;
}

/** Egy cikk metaadata a jegyzékből. */
export async function cikkMeta(slug) {
  const { cikkek } = await jegyzekBetolt();
  return cikkek.find((cikk) => cikk.slug === slug) ?? null;
}

/**
 * A teljes cikk: metaadat a jegyzékből, törzs a Markdown fájlból.
 * @returns {Promise<{ meta: object, html: string }>}
 */
export async function cikkBetolt(slug) {
  const meta = await cikkMeta(slug);
  if (!meta) throw new Error(`Nincs ilyen cikk: ${slug}`);

  if (!torzsCache.has(slug)) {
    const valasz = await fetch(meta.path);
    if (!valasz.ok) throw new Error(`A cikk szövege nem tölthető be (${valasz.status}).`);
    const { torzs } = frontmatterBont(await valasz.text());
    torzsCache.set(slug, markdownRenderel(torzs));
  }

  return { meta, html: torzsCache.get(slug) };
}

/** A rovatok a cikkek előfordulási gyakorisága szerint, csökkenő sorrendben. */
export function rovatok(cikkek) {
  const szamlalo = new Map();
  for (const cikk of cikkek) {
    if (!cikk.section) continue;
    szamlalo.set(cikk.section, (szamlalo.get(cikk.section) ?? 0) + 1);
  }
  return [...szamlalo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hu'))
    .map(([nev, darab]) => ({ nev, darab }));
}

function markdownRenderel(torzs) {
  if (!globalThis.marked) throw new Error('A Markdown-értelmező nem töltődött be.');
  const html = globalThis.marked.parse(torzs, { gfm: true, breaks: false });

  // A képeket lusta betöltésre állítjuk, a külső hivatkozásokat új lapra.
  const doboz = document.createElement('div');
  doboz.innerHTML = html;
  for (const kep of doboz.querySelectorAll('img')) {
    kep.setAttribute('loading', 'lazy');
    kep.setAttribute('decoding', 'async');
  }
  for (const link of doboz.querySelectorAll('a[href^="http"]')) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
  }
  return doboz.innerHTML;
}
