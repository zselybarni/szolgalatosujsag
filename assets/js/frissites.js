/**
 * A félretett laphoz visszatérő olvasó.
 *
 * A cikkjegyzéket induláskor egyszer olvassuk be, tehát hiába kérünk mindent
 * ellenőriztetve (lásd `content.js`), ha nincs kérés: a nyitva hagyott lap
 * magától sosem tudna meg új cikkről. Ezért `HIRFOLYAM.frissitesPercek`
 * sűrűséggel megnézzük a jegyzéket, amíg a lap látszik – és akkor is, amikor
 * újra láthatóvá válik: fülváltás, ablakra kattintás, vissza-gomb. (Csak a
 * visszatérésre figyelni kevés volt: aki a lapon ülve várja a saját frissen
 * közzétett cikkét, sosem váltana fület.)
 *
 * Ha változott, **szólunk, nem cserélünk**: az olvasó szeme előtt átrendeződő
 * hírfolyam – elvesző görgetési hely, becsukódó „Továbbiak” – rosszabb lenne
 * annál, mint amit megold. A csere az ő kattintására történik.
 */

import { HIRFOLYAM } from './config.js';
import { jegyzekUjratolt } from './content.js';
import { elem, ikon, urit } from './dom.js';

/** Ennyi ideig nem kérdezünk újra, akárhányszor vált vissza a fül. */
const SZUNET = Math.max(0, HIRFOLYAM.frissitesPercek ?? 0) * 60_000;

/**
 * @param {{ ujraRajzol: (cikkek: object[]) => void }} beallitas
 *   Az `ujraRajzol` a mostani nézetet rajzolja újra a friss jegyzékből.
 */
export function frissitesInditas({ ujraRajzol }) {
  const ajanlat = document.getElementById('frissites');
  if (!SZUNET || !ajanlat) return; // 0 perc: a lap sosem frissül magától

  let utolsoNezes = Date.now();
  let fut = false;
  let frissCikkek = [];

  ajanlat.addEventListener('click', () => {
    const cikkek = frissCikkek;
    elrejt();
    ujraRajzol(cikkek);
    // A változás a hírfolyam tetején van, az olvasó viszont bárhol tarthat.
    // „Megnézem” után lássa is, amit kért. (Az útválasztó ugyanígy ugrik.)
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  });

  // Új nézetre lépve úgyis a friss jegyzékből rajzolunk: nincs mit ajánlani.
  window.addEventListener('hashchange', elrejt);

  document.addEventListener('visibilitychange', nezes);
  // Az ablakra visszakattintás a fülváltással ellentétben nem láthatóságváltás,
  // a vissza-gombbal (bfcache) visszahozott lap pedig `pageshow`-val érkezik.
  window.addEventListener('focus', nezes);
  window.addEventListener('pageshow', nezes);

  // A nyitott lap magától is körülnéz. Az időzítő nem a szünetet méri – azt a
  // `nezes` teszi a visszatérésekre –, hanem maga adja a ritmust.
  setInterval(() => { if (lathato() && !fut) megnez(); }, SZUNET);

  function nezes() {
    if (!lathato() || fut) return;
    if (Date.now() - utolsoNezes < SZUNET) return;
    megnez();
  }

  function lathato() {
    return document.visibilityState === 'visible';
  }

  async function megnez() {
    fut = true;
    try {
      const { valtozott, ujCikkek, valtozottCikkek, cikkek } = await jegyzekUjratolt();
      utolsoNezes = Date.now();
      if (!valtozott) return;
      frissCikkek = cikkek;
      mutat(ujCikkek, valtozottCikkek);
    } catch {
      // Elérhetetlen kiszolgáló: maradjon a lap, ami volt. Majd legközelebb.
    } finally {
      fut = false;
    }
  }

  function mutat(ujCikkek, valtozottCikkek) {
    // Előbb látszik, utána kap szöveget: a rejtett elem változását a
    // képernyőolvasó nem mondaná be.
    ajanlat.hidden = false;
    urit(ajanlat).append(
      ikon('ikon-frissites', 'frissites__ikon'),
      elem('span', { szoveg: frissitesSzoveg(ujCikkek, valtozottCikkek) }),
    );
  }

  function elrejt() {
    ajanlat.hidden = true;
  }
}

/**
 * Az ajánlat felirata.
 *
 * Az új cikket megszámoljuk, a módosultat viszont megnevezzük: egy átírt
 * törzstől a kártyák mit sem változnak, tehát a puszta „Frissült a lap” után
 * az olvasó joggal hinné, hogy a gomb nem csinált semmit.
 */
export function frissitesSzoveg(ujCikkek = [], valtozottCikkek = []) {
  if (ujCikkek.length === 1) return 'Új cikk érkezett – megnézem';
  if (ujCikkek.length > 1) return `${ujCikkek.length} új cikk érkezett – megnézem`;
  if (valtozottCikkek.length === 1) return `Frissült: ${rovidCim(valtozottCikkek[0].title)} – megnézem`;
  if (valtozottCikkek.length > 1) return `${valtozottCikkek.length} cikk frissült – megnézem`;
  return 'Frissült a lap – megnézem';
}

/** Hosszú cím a gombon: maradjon meg egy-két sornak telefonon is. */
function rovidCim(cim, max = 32) {
  const szoveg = String(cim ?? '').trim();
  if (!szoveg) return 'egy cikk';
  return szoveg.length > max ? `${szoveg.slice(0, max - 1).trimEnd()}…` : szoveg;
}
