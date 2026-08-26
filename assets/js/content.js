/**
 * A cikkek betöltése. A statikus tárhelyen nincs könyvtárlistázás, ezért a
 * kliens a `content/index.json` jegyzékből tudja, milyen cikkek léteznek –
 * ezt a `tools/build-index.mjs` állítja elő a .md fájlok fejlécéből.
 *
 * A hírfolyam kirajzolásához elég a jegyzék; a Markdown törzs csak akkor
 * töltődik le, amikor az olvasó megnyit egy cikket.
 *
 * ## Frissesség a böngésző gyorsítótára ellenében
 *
 * A GitHub Pages `Cache-Control: max-age=600`-zal adja ki a .json és .md
 * fájlokat, tehát a böngésző tíz percig kérdezés nélkül a saját másolatát
 * mutatja. Így egy frissen közzétett cikk az olvasónak addig nem is létezik –
 * a fejléceket pedig statikus tárhelyen nem tudjuk átírni. Két eszközünk van,
 * és mind a kettő a kliensé:
 *
 *   – a **jegyzéket** minden betöltéskor újraellenőriztetjük a kiszolgálóval
 *     (`cache: 'no-cache'` – feltételes kérés, változatlan fájlnál 304-es
 *     válasz, nulla bájt letöltés), mert erre nincs más fogódzónk: a jegyzék
 *     címét nem tudjuk mihez igazítani;
 *   – a **cikkek törzsét** viszont igen: a jegyzékben ott a `verzio`, a fájl
 *     tartalmából képzett rövid ujjlenyomat, amit a cím után teszünk. Amíg a
 *     cikk nem változik, a böngésző nyugodtan a mentett példányt használja,
 *     módosítás után viszont más címet kér le. Ez a friss jegyzékre épül: a
 *     verzió onnan jön.
 */

import { UTVONALAK } from './config.js';
import { datum, napKulonbseg } from './format.js';
import { frontmatterBont } from './frontmatter.js';

let jegyzekIgeret = null;
const torzsCache = new Map();

/** Kérésbeállítás: a kiszolgáló mondja meg, változott-e a fájl. */
const MINDIG_FRISS = { cache: 'no-cache' };

/**
 * Előnézeti mód: `?elonezet=1` a lap címében megmutatja a jövőre datált
 * cikkeket is. Enélkül egy jövőbeli dátum ütemezésként működik – a cikk a
 * saját napján magától megjelenik, újbóli közzététel nélkül.
 */
// A `globalThis.location` a böngészőben mindig megvan; az elhagyható tagolás
// azért kell, hogy a modul a lapon kívül – például a tesztekben – is betölthető
// legyen. Ilyenkor nincs cím, tehát nincs előnézet sem.
const elonezet = new URLSearchParams(globalThis.location?.search ?? '').has('elonezet');

/** @returns {Promise<{ cikkek: object[] }>} */
export function jegyzekBetolt() {
  if (!jegyzekIgeret) {
    jegyzekIgeret = jegyzekLetolt()
      .then((adat) => {
        const rendezett = [...(adat.cikkek ?? [])]
          .sort((a, b) => datum(b.date) - datum(a.date));
        return {
          ...adat,
          // A szűrés az olvasó órájához igazodik, ezért a megjelenéshez nem kell
          // új közzététel: a cikk a saját napján lép be a hírfolyamba.
          cikkek: rendezett.filter((cikk) => elonezet || napKulonbseg(datum(cikk.date)) >= 0),
          /** Szűrés nélkül, az ütemezett cikkekkel együtt – a szerkesztőnek. */
          mindenCikk: rendezett,
        };
      })
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
    const { torzs } = frontmatterBont(await cikkTorzsLetolt(meta));
    torzsCache.set(slug, markdownRenderel(torzs));
  }

  return { meta, html: torzsCache.get(slug) };
}

/**
 * A jegyzék letöltése: elsőként a kiszolgálótól, ellenőriztetve.
 *
 * Ha nincs hálózat, inkább a böngésző mentett – akár nem friss – példánya
 * jöjjön, mint egy üres lap: ugyanaz az elv, amit az időjárás-jelző követ.
 * Ez csak a gyorsítótár friss ablakán belül segít, de pont annyit ad vissza,
 * amennyit a szigorúbb kérés elvett.
 */
async function jegyzekLetolt() {
  const fejlec = { Accept: 'application/json' };
  let valasz;
  try {
    valasz = await fetch(UTVONALAK.indexJson, { headers: fejlec, ...MINDIG_FRISS });
  } catch {
    valasz = await fetch(UTVONALAK.indexJson, { headers: fejlec });
  }
  if (!valasz.ok) throw new Error(`A cikkjegyzék nem tölthető be (${valasz.status}).`);
  return valasz.json();
}

/**
 * A cikk törzsének címe: a fájl útvonala a jegyzékbeli verzióval.
 * @param {{ path: string, verzio?: string }} meta a cikk jegyzékbeli sora
 */
export function cikkForras(meta) {
  return meta.verzio ? `${meta.path}?v=${encodeURIComponent(meta.verzio)}` : meta.path;
}

/**
 * A cikk nyers Markdown fájlja. Ezen a lap és a szerkesztő is osztozik, hogy
 * egyikük se dolgozzon a böngésző régi másolatából – a szerkesztőnél ez a
 * visszaírásnál számít igazán.
 *
 * @param {{ path: string, verzio?: string }} meta
 * @returns {Promise<string>} a fájl teljes tartalma, fejléccel együtt
 */
export async function cikkTorzsLetolt(meta) {
  // Verzió nélküli (régebbi) jegyzéknél nincs mihez igazítani a címet:
  // ilyenkor a kiszolgálótól kérdezzük meg, változott-e a fájl.
  const valasz = await fetch(cikkForras(meta), meta.verzio ? {} : MINDIG_FRISS);
  if (!valasz.ok) throw new Error(`A cikk szövege nem tölthető be (${valasz.status}).`);
  return valasz.text();
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

/** Markdown → HTML. A szerkesztő előnézete ugyanezt használja, hogy ne térjen el. */
export function markdownRenderel(torzs) {
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
