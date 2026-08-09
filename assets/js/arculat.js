/**
 * A lap nevét és feliratait a config.js-ből írja ki a lapfejbe, a láblécbe és
 * a fül címébe.
 *
 * Az index.html ugyanezeket a szövegeket tartalmazza kiindulásként, hogy
 * JavaScript nélkül – például keresőrobotnak – se legyen névtelen a lap;
 * betöltéskor viszont mindig a config.js győz, így az átnevezés egy fájl
 * egyetlen sora marad.
 */

import { LAP } from './config.js';

export function arculatAlkalmaz() {
  szoveg('.lapcim__nev', LAP.nev);
  szoveg('.lapcim__alcim', LAP.alcim);
  szoveg('#lablec-nev', LAP.nev);

  document.title = `${LAP.nev} – ${LAP.alcim}`;
  document.documentElement.lang = LAP.nyelv.split('-')[0];

  const leiras = document.querySelector('meta[name="description"]');
  if (leiras) leiras.setAttribute('content', LAP.leiras);
}

function szoveg(valaszto, ertek) {
  const csomopont = document.querySelector(valaszto);
  if (csomopont) csomopont.textContent = ertek;
}
