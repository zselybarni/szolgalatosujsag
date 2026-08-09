/**
 * A lead (ajánló) előállítása és tördelése.
 *
 * Két dolgot csinál, mindkettőt építési időben:
 *   1. Ha a cikk fejlécében nincs lead, az első bekezdésből készít egyet.
 *   2. A leadet kiegyenlített hosszúságú sorokra tördeli, hogy a `.md` fájl
 *      fejléce olvasható maradjon.
 *
 * A tördelés a megjelenítést nem befolyásolja: a fejlécolvasó a `>` blokk
 * sortöréseit szóközzé alakítja vissza, tehát a lap egyetlen bekezdést lát.
 */

import { LEAD } from './config.js';

/** Az első bekezdésből készít ajánlót, jelölések nélkül, lerövidítve. */
export function leadSzarmaztat(torzs, maxHossz = LEAD.maxHossz) {
  const bekezdes = elsoBekezdes(torzs);
  if (!bekezdes) return '';
  return rovidit(jelolesNelkul(bekezdes), maxHossz);
}

/**
 * Kiegyenlített sorokra tördel. Az azonos sorszámú tördelések közül azt
 * választja, amelyikben a sorok hossza a legkevésbé szór – így nem marad
 * egyetlen árva szó az utolsó sorban.
 *
 * @returns {string[]} a sorok, behúzás nélkül
 */
export function leadTordel(szoveg, maxSzelesseg = LEAD.sorSzelesseg) {
  const tiszta = szoveg.trim().replace(/\s+/g, ' ');
  const szavak = tiszta.split(' ').filter(Boolean);
  if (!szavak.length) return [];
  if (tiszta.length <= maxSzelesseg) return [tiszta];

  const legkevesebbSor = Math.ceil(tiszta.length / maxSzelesseg);
  const kiindulas = Math.ceil(tiszta.length / legkevesebbSor);

  let legjobb = null;
  for (let cel = kiindulas; cel <= maxSzelesseg; cel += 1) {
    const sorok = tordel(szavak, cel);
    const pont = pontszam(sorok, legkevesebbSor);
    if (!legjobb || pont < legjobb.pont) legjobb = { sorok, pont };
  }
  return legjobb.sorok;
}

/* ------------------------------------------------------------------------ */

function elsoBekezdes(torzs) {
  for (const blokk of torzs.split(/\r?\n\s*\r?\n/)) {
    const sorok = blokk.split(/\r?\n/).map((sor) => sor.trim()).filter(Boolean);
    if (!sorok.length) continue;
    // Cím, önálló kép, lista, idézet, táblázat, kódblokk és nyers HTML nem lead.
    if (/^(#|!\[|[-*+]\s|\d+\.\s|>|\||```|~~~|<)/.test(sorok[0])) continue;
    return sorok.join(' ');
  }
  return '';
}

function jelolesNelkul(szoveg) {
  return szoveg
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(?=\S)(.*?)(?<=\S)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

function rovidit(szoveg, maxHossz) {
  if (szoveg.length <= maxHossz) return szoveg;

  const vagott = szoveg.slice(0, maxHossz + 1);
  const mondatVege = utolsoMondatVege(vagott);
  // Mondathatáron csak akkor vágunk, ha nem lesz tőle csonka az ajánló.
  if (mondatVege > maxHossz * 0.55) return vagott.slice(0, mondatVege).trim();

  const szoHatar = vagott.lastIndexOf(' ');
  return `${vagott.slice(0, szoHatar > 0 ? szoHatar : maxHossz).trim()}…`;
}

function utolsoMondatVege(szoveg) {
  let hely = -1;
  for (const talalat of szoveg.matchAll(/[.!?…](?=\s|$)/g)) hely = talalat.index + 1;
  return hely;
}

function tordel(szavak, cel) {
  const sorok = [];
  let mostani = '';
  for (const szo of szavak) {
    if (!mostani) mostani = szo;
    else if (`${mostani} ${szo}`.length <= cel) mostani += ` ${szo}`;
    else { sorok.push(mostani); mostani = szo; }
  }
  if (mostani) sorok.push(mostani);
  return sorok;
}

function pontszam(sorok, legkevesebbSor) {
  // A többletsor sokkal rosszabb, mint az egyenetlenség: előbb a sorszám dönt.
  const tobbletSor = (sorok.length - legkevesebbSor) * 1000;
  const atlag = sorok.reduce((osszeg, sor) => osszeg + sor.length, 0) / sorok.length;
  const szoras = Math.sqrt(
    sorok.reduce((osszeg, sor) => osszeg + (sor.length - atlag) ** 2, 0) / sorok.length,
  );
  return tobbletSor + szoras + arvaSzavak(sorok) * 25;
}

/**
 * Sorvégen lógva maradt egy-két betűs szó ("a", "az", "és"). Nem tilos, de a
 * pontozásban rontja a tördelést, így csak akkor marad, ha nincs jobb megoldás.
 */
function arvaSzavak(sorok) {
  return sorok
    .slice(0, -1)
    .filter((sor) => (sor.split(' ').pop() ?? '').length <= 2)
    .length;
}
