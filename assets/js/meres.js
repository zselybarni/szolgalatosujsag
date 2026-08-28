/**
 * Mérés: mit csinál az olvasó a lapon.
 *
 * Ez az egyetlen hely, ahol a lap a Google Analyticsszel beszél – a mérőkódot
 * maga az `index.html` tölti be, lásd a
 * [0009-es ADR-t](../../docs/adr/0009-latogatottsagmeres-google-analytics.md).
 * Két oka van, hogy külön modul: így a `gtag` hiánya egyetlen ponton kezelendő
 * – blokkoló mögött, régi böngészőben vagy a szerkesztőn egyszerűen nincs –, és
 * a nézetek kódjából nem lóg ki mérési teendő. A kattintások nagy részét egy
 * közös figyelő veszi észre, ezért a hírfolyam, a hírsáv, az időjárás és a
 * témaváltó kódjához nem is kellett hozzányúlni.
 *
 * Az események magyar nevűek, mint a lap kódjában minden más (lásd a
 * [0004-es ADR-t](../../docs/adr/0004-magyar-kod-angol-fejlecmezok.md)); a GA4
 * csak ékezet nélküli betűt, számot és aláhúzást enged. Hogy melyik esemény
 * mire jó, és mit kell hozzá a GA4-ben felvenni: `docs/meres.md`.
 */

import { elem } from './dom.js';

/** A GA4 ennyi jelig tartja meg egy paraméter értékét. */
const ERTEK_HOSSZ = 100;

/** Cikkhivatkozás → honnan indult a kattintás. Sorrendben az első találat nyer. */
const FORRASOK = [
  ['.hirsav__tetel', 'hirsav'],
  ['.ajanlo__tetel', 'ajanlo'],
  ['.vezeto', 'vezeto'],
  ['.kartya__link', 'kartya'],
];

/** A legutóbbi cikkre kattintás helye; a cikknézet ezt jelenti be. */
let utolsoForras = 'kozvetlen';
let olvasasFigyelo = null;

/**
 * Egyetlen pont, ahol a laptól esemény megy a mérésbe.
 *
 * @param {string} nev az esemény neve (GA4: betűvel kezdődő, ékezet nélküli)
 * @param {object} adatok paraméterek; a hosszú értékeket levágjuk
 */
export function esemeny(nev, adatok = {}) {
  try {
    if (typeof globalThis.gtag !== 'function') return; // blokkoló, vagy a szerkesztő
    globalThis.gtag('event', nev, Object.fromEntries(
      Object.entries(adatok).map(([kulcs, ertek]) => [kulcs, rovid(ertek)]),
    ));
  } catch {
    // A mérés sosem ronthatja el a lapot: ha a gtag hibázik, nem történt semmi.
  }
}

/** A közös kattintásfigyelő. A lap indulásakor egyszer kell meghívni. */
export function meresInditas() {
  document.addEventListener('click', kattintas);
}

/**
 * A megnyitott cikk. A címét és a rovatát is elküldjük, hogy a jelentésben ne
 * kelljen fejben feloldani a fájlneveket, a `honnan` pedig megmondja, a lap
 * melyik része viszi az olvasót a cikkekhez.
 */
export function cikkMegnyitas(meta) {
  esemeny('cikk_megnyitas', {
    cikk_cim: meta.title,
    cikk_slug: meta.slug,
    rovat: meta.section || 'nincs',
    honnan: utolsoForras,
  });
  utolsoForras = 'kozvetlen';
  olvasasFigyeles(meta);
}

/* ------------------------------------------------------------------------ */

function kattintas(esem) {
  const cel = esem.target?.closest?.('a, button');
  if (!cel) return;

  // Cikkhivatkozásnál nem itt mérünk: a nézet jelenti be, mert ő ismeri a
  // cikk címét és rovatát. Itt csak megjegyezzük, honnan indult a kattintás.
  if (cel.matches('a[href^="#/cikk/"]')) {
    utolsoForras = FORRASOK.find(([valaszto]) => cel.closest(valaszto))?.[1] ?? 'egyeb';
    return;
  }

  if (cel.matches('.rovatsav__elem')) {
    esemeny('rovat_valtas', { rovat: rovatNevbol(cel.getAttribute('href')) });
    return;
  }

  // A továbbiak gombnál a kattintás után számoljuk a kártyákat: addigra a
  // hírfolyam már kirakta a következő adagot.
  if (cel.matches('.gomb--tovabb')) {
    esemeny('tovabbiak', { latszik: document.querySelectorAll('.kartya').length });
    return;
  }

  if (cel.closest('#idojaras-gomb')) {
    esemeny('idojaras_megnyitas');
    return;
  }

  // A témaváltó saját kezelője előbb fut, tehát a beállított téma már látszik.
  if (cel.closest('#tema-valto')) {
    esemeny('tema_valtas', { tema: document.documentElement.getAttribute('data-theme') || 'rendszer' });
  }
}

/**
 * Végigolvasás: a cikk törzsének a végére tett jel látótérbe került.
 *
 * A megnyitás még nem olvasás – a kettő különbsége mondja meg, melyik cikket
 * olvassák tényleg végig. A rövid cikkeknél ez azonnal teljesül, ezért az
 * eltelt másodpercet is elküldjük: abból derül ki, olvasták-e vagy csak
 * megnyitották.
 */
function olvasasFigyeles(meta) {
  olvasasFigyelo?.disconnect();
  olvasasFigyelo = null;

  const torzs = document.querySelector('.cikk__torzs');
  if (!torzs || typeof IntersectionObserver !== 'function') return;

  const kezdet = Date.now();
  const jel = elem('div', { osztaly: 'olvasas-jel', 'aria-hidden': 'true' });
  torzs.append(jel);

  olvasasFigyelo = new IntersectionObserver((bejegyzesek) => {
    if (!bejegyzesek.some((bejegyzes) => bejegyzes.isIntersecting)) return;
    olvasasFigyelo.disconnect();
    olvasasFigyelo = null;
    esemeny('cikk_vegigolvasva', {
      cikk_cim: meta.title,
      cikk_slug: meta.slug,
      masodperc: Math.round((Date.now() - kezdet) / 1000),
    });
  });
  olvasasFigyelo.observe(jel);
}

/** `#/rovat/Vas%C3%BAt` → `Vasút`; a „Minden hír” gomb címe csak `#/`. */
function rovatNevbol(hivatkozas) {
  const resz = String(hivatkozas ?? '').split('/rovat/')[1];
  if (!resz) return 'minden';
  try {
    return decodeURIComponent(resz);
  } catch {
    return resz;
  }
}

function rovid(ertek) {
  if (typeof ertek !== 'string') return ertek;
  return ertek.length > ERTEK_HOSSZ ? ertek.slice(0, ERTEK_HOSSZ) : ertek;
}
