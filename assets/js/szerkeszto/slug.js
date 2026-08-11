/**
 * Fájlnév és webcím képzése a címből.
 *
 * A magyar ékezeteket le kell bontani, mert a fájlnév a cikk webcíme is: az
 * „Új váltókezelő" ékezetesen `%C3%9Aj%20...` alakúra kódolódna a címsorban.
 */

const MAX_HOSSZ = 70;
/** Az ékezetek Unicode-blokkja: az NFD ide bontja szét a mellékjeleket. */
const EKEZETEK = /[̀-ͯ]/g;

/** „Új váltókezelői szolgálat" → „uj-valtokezeloi-szolgalat" */
export function slugositas(szoveg) {
  return String(szoveg)
    .normalize('NFD')            // ő → o + kettős hosszú ékezet
    .replace(EKEZETEK, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_HOSSZ)
    .replace(/-+$/g, '');
}

/** A teljes fájlnév kiterjesztés nélkül: dátum + cím. */
export function fajlnevBol(datum, cim) {
  const resz = slugositas(cim);
  const nap = /^\d{4}-\d{2}-\d{2}$/.test(datum) ? datum : '';
  if (!nap) return resz;
  return resz ? `${nap}-${resz}` : nap;
}

/** Elfogadható-e fájlnévként: csak kisbetű, szám és kötőjel. */
export function slugHelyes(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/** Ékezet- és kisbetű-független alak, a majdnem-egyező címkék kiszűrésére. */
export function normalizalt(szoveg) {
  return String(szoveg)
    .normalize('NFD')
    .replace(EKEZETEK, '')
    .toLowerCase()
    .trim();
}
