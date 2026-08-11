/**
 * A piszkozatból `.md` fájl.
 *
 * A mezők sorrendje szándékosan ugyanaz, amit az indexelő visszaír (a lead a
 * dátum után áll), így a `npm run index` nem fogja átrendezni a fájlt.
 * A modul tisztán szöveget gyárt – DOM-hoz nem nyúl, ezért tesztelhető.
 */

import { leadTordel } from '../lead.js';

/**
 * @param {object} piszkozat
 * @returns {string} a teljes fájl tartalma, LF sorvégekkel
 */
export function markdownOsszeallit(piszkozat) {
  const sorok = ['---'];

  sorok.push(`title: ${skalar(piszkozat.title ?? '')}`);
  if (piszkozat.date) sorok.push(`date: ${piszkozat.date}`);

  const lead = egySoros(piszkozat.lead ?? '');
  if (lead) sorok.push('lead: >', ...leadTordel(lead).map((sor) => `  ${sor}`));

  if (piszkozat.section) sorok.push(`section: ${skalar(piszkozat.section)}`);
  if (piszkozat.author) sorok.push(`author: ${skalar(piszkozat.author)}`);
  if (piszkozat.cover) sorok.push(`cover: ${skalar(piszkozat.cover)}`);
  if (piszkozat.coverAlt) sorok.push(`coverAlt: ${skalar(piszkozat.coverAlt)}`);
  if (piszkozat.featured) sorok.push('featured: true');

  const cimkek = (piszkozat.tags ?? []).map((c) => String(c).trim()).filter(Boolean);
  if (cimkek.length) sorok.push(...cimkeSorok(cimkek));

  sorok.push('---', '');

  const torzs = String(piszkozat.torzs ?? '').replace(/\r\n/g, '\n').trim();
  return `${sorok.join('\n')}\n${torzs ? `${torzs}\n` : ''}`;
}

/** A javasolt fájlnév a repóban. */
export function fajlUtvonal(piszkozat) {
  return `content/cikkek/${piszkozat.slug}.md`;
}

/* ------------------------------------------------------------------------ */

function cimkeSorok(cimkek) {
  // Vesszőt tartalmazó címke a sorbeli alakban összeolvadna, ezért olyankor
  // – és hosszú listánál – soronkénti felsorolást írunk.
  const egySorban = `tags: [${cimkek.join(', ')}]`;
  if (!cimkek.some((c) => c.includes(',')) && egySorban.length <= 76) return [egySorban];
  return ['tags:', ...cimkek.map((c) => `  - ${skalar(c)}`)];
}

/**
 * Skalár érték kiírása. Idézőjelet csak ott használunk, ahol a fejlécolvasó
 * másként értelmezné a szöveget – a cikkek így olvashatóak maradnak.
 */
function skalar(ertek) {
  const szoveg = egySoros(ertek);
  const idezojelKell = szoveg === ''
    || szoveg !== szoveg.trim()
    || /^[[>|#]/.test(szoveg)
    || /\s#\s/.test(szoveg)
    || /^(true|false|null|~)$/i.test(szoveg)
    || /^-?\d+(\.\d+)?$/.test(szoveg);

  if (!idezojelKell) return szoveg;
  return `"${szoveg.replace(/"/g, '\\"')}"`;
}

function egySoros(ertek) {
  return String(ertek ?? '').replace(/\s+/g, ' ').trim();
}
