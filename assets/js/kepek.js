/**
 * Képútvonalak kiszedése és ellenőrzése.
 *
 * Ugyanezt használja az indexelő (építéskor, a fájlrendszerrel együtt) és a
 * szerkesztő (a böngészőben, a képjegyzék alapján) – így a két helyen nem
 * csúszhat szét, mi számít jó képútvonalnak.
 */

const KEP_MINTAK = [
  /!\[[^\]]*\]\(\s*([^)\s]+)/g,
  /<img[^>]+src\s*=\s*["']([^"']+)["']/gi,
];

/** A cikk törzsébe ágyazott képek útvonalai, egyszer-egyszer felsorolva. */
export function beagyazottKepek(torzs) {
  const talalatok = new Set();
  for (const minta of KEP_MINTAK) {
    for (const talalat of torzs.matchAll(minta)) {
      talalatok.add(tisztit(talalat[1]));
    }
  }
  talalatok.delete('');
  return [...talalatok];
}

export function tisztit(nyersUtvonal) {
  return String(nyersUtvonal).trim().replace(/^["']|["']$/g, '');
}

/** Beágyazott adat (data:) vagy más kiszolgálón lévő kép. */
export function tavoliKep(utvonal) {
  return /^(https:)?\/\//i.test(utvonal) || /^data:/i.test(utvonal);
}

/**
 * A címben magában lévő hibák – fájlrendszer nélkül eldönthetők.
 * @returns {string|null} a hiba szövege, vagy null, ha a cím rendben van
 */
export function kepUtvonalHiba(utvonal) {
  if (!utvonal) return null;

  if (/^http:\/\//i.test(utvonal)) {
    return `a kép http:// címen van, a https-en futó lap nem tölti be: ${utvonal}`;
  }
  if (tavoliKep(utvonal)) return null;
  if (utvonal.startsWith('/')) {
    return `a képútvonal abszolút, a projektoldalon eltörik: ${utvonal}`;
  }
  if (utvonal.includes('../')) {
    return `a képútvonal a cikkhez képest relatív; a lap gyökeréhez képest add meg: ${utvonal}`;
  }
  return null;
}
