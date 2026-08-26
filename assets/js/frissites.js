/**
 * A félretett laphoz visszatérő olvasó.
 *
 * A cikkjegyzéket induláskor egyszer olvassuk be, tehát hiába kérünk mindent
 * ellenőriztetve (lásd `content.js`), ha nincs kérés: egy háttérben hagyott
 * fül magától sosem tudna meg új cikkről. Ezért amikor a lap újra láthatóvá
 * válik – fülváltás, ablakra kattintás, vissza-gomb –, megnézzük a jegyzéket.
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
  });

  // Új nézetre lépve úgyis a friss jegyzékből rajzolunk: nincs mit ajánlani.
  window.addEventListener('hashchange', elrejt);

  document.addEventListener('visibilitychange', nezes);
  // Az ablakra visszakattintás a fülváltással ellentétben nem láthatóságváltás,
  // a vissza-gombbal (bfcache) visszahozott lap pedig `pageshow`-val érkezik.
  window.addEventListener('focus', nezes);
  window.addEventListener('pageshow', nezes);

  function nezes() {
    if (document.visibilityState !== 'visible') return;
    if (fut || Date.now() - utolsoNezes < SZUNET) return;
    megnez();
  }

  async function megnez() {
    fut = true;
    try {
      const { valtozott, ujCikkek, cikkek } = await jegyzekUjratolt();
      utolsoNezes = Date.now();
      if (!valtozott) return;
      frissCikkek = cikkek;
      mutat(ujCikkek);
    } catch {
      // Elérhetetlen kiszolgáló: maradjon a lap, ami volt. Majd legközelebb.
    } finally {
      fut = false;
    }
  }

  function mutat(ujCikkek) {
    // Előbb látszik, utána kap szöveget: a rejtett elem változását a
    // képernyőolvasó nem mondaná be.
    ajanlat.hidden = false;
    urit(ajanlat).append(
      ikon('ikon-frissites', 'frissites__ikon'),
      elem('span', { szoveg: frissitesSzoveg(ujCikkek) }),
    );
  }

  function elrejt() {
    ajanlat.hidden = true;
  }
}

/**
 * Az ajánlat felirata. Az új cikkeket megszámoljuk, mert az olvasónak az mond
 * valamit; ha csak egy meglévő cikk változott, arról általánosan szólunk.
 */
export function frissitesSzoveg(ujCikkek = []) {
  if (!ujCikkek.length) return 'Frissült a lap – megnézem';
  if (ujCikkek.length === 1) return 'Új cikk érkezett – megnézem';
  return `${ujCikkek.length} új cikk érkezett – megnézem`;
}
