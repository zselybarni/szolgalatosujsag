/**
 * A piszkozat ellenőrzése – ugyanazok a szabályok, amiket az indexelés is
 * megkövetel, csak itt még a beküldés előtt derül ki, mi hiányzik.
 *
 * Tisztán adatból dolgozik, ezért tesztelhető és a DOM-tól független.
 * Szintek: `hiba` (az indexelés elbukna rajta), `figyelmeztetes` (megjelenik,
 * de valószínűleg nem ezt akartad), `info` (működik, csak tudd, mi lesz).
 */

import { HIRFOLYAM, HIRSAV, LEAD } from '../config.js';
import { beagyazottKepek, kepUtvonalHiba, tavoliKep } from '../kepek.js';
import { normalizalt, slugHelyes } from './slug.js';

const MAX_CIM = 90;

/**
 * A szerkesztés alatt álló cikk saját fájlnevét nem tekintjük ütközésnek –
 * ezt a piszkozat `eredetiSlug` mezője mondja meg.
 *
 * @param {object} piszkozat
 * @param {{ cikkek?: object[], kepek?: string[], ma?: Date }} kornyezet
 * @returns {{ szint: 'hiba'|'figyelmeztetes'|'info', szoveg: string }[]}
 */
export function ellenoriz(piszkozat, kornyezet = {}) {
  const { cikkek = [], kepek = [], ma = new Date() } = kornyezet;
  const eredetiSlug = piszkozat.eredetiSlug ?? null;
  const uzenetek = [];
  const hiba = (szoveg) => uzenetek.push({ szint: 'hiba', szoveg });
  const figyelmeztetes = (szoveg) => uzenetek.push({ szint: 'figyelmeztetes', szoveg });
  const info = (szoveg) => uzenetek.push({ szint: 'info', szoveg });

  /* --- cím ------------------------------------------------------------- */
  const cim = (piszkozat.title ?? '').trim();
  if (!cim) hiba('A cím kötelező – enélkül az indexelés elbukik.');
  else if (cim.length > MAX_CIM) {
    figyelmeztetes(`A cím ${cim.length} jel hosszú; ${MAX_CIM} fölött a kártyán nagyon sok sorba tördelődik.`);
  }

  /* --- dátum ----------------------------------------------------------- */
  const datumSzoveg = (piszkozat.date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datumSzoveg)) {
    hiba('A dátum ÉÉÉÉ-HH-NN alakú legyen, például 2026-08-14.');
  } else {
    const eltelt = napKulonbseg(datumSzoveg, ma);
    if (eltelt < 0) {
      info(`Jövőbeli dátum: a cikk ütemezve van, ${-eltelt} nap múlva jelenik meg magától.`);
    } else if (eltelt < HIRSAV.napok) {
      info('A cikk felkerül a friss hírek szalagjára.');
    }
    if (piszkozat.featured && eltelt >= HIRFOLYAM.kiemelesNapok) {
      figyelmeztetes(`A kiemelés ${HIRFOLYAM.kiemelesNapok} nap után elévül, ez a dátum ennél régebbi – a cikk nem lesz vezető cikk.`);
    }
  }

  /* --- fájlnév --------------------------------------------------------- */
  const slug = (piszkozat.slug ?? '').trim();
  if (!slug) hiba('A fájlnév nem lehet üres.');
  else if (!slugHelyes(slug)) {
    hiba('A fájlnév csak kisbetűt, számot és kötőjelet tartalmazhat (ékezet és szóköz nélkül).');
  } else if (slug !== eredetiSlug && cikkek.some((c) => c.slug === slug)) {
    hiba(`Már van cikk ezzel a fájlnévvel: ${slug}.md – válassz mást, különben felülírnád.`);
  }

  /* --- lead ------------------------------------------------------------ */
  const lead = (piszkozat.lead ?? '').trim();
  if (!lead) {
    info('Nincs lead: az indexelés az első bekezdésből készít egyet.');
  } else if (lead.length > LEAD.maxHossz) {
    figyelmeztetes(`A lead ${lead.length} jel; a kártyán három sor után elvágjuk.`);
  }

  /* --- rovat és címkék ------------------------------------------------- */
  if (!(piszkozat.section ?? '').trim()) {
    figyelmeztetes('Nincs rovat: a cikk kimarad a rovatsávból.');
  }
  for (const uzenet of hasonloak(piszkozat, cikkek)) figyelmeztetes(uzenet);

  /* --- képek ----------------------------------------------------------- */
  const borito = (piszkozat.cover ?? '').trim();
  if (borito && !(piszkozat.coverAlt ?? '').trim()) {
    figyelmeztetes('Van borítókép, de nincs leírása (coverAlt) – ez a képaláírás is egyben.');
  }
  for (const utvonal of [borito, ...beagyazottKepek(piszkozat.torzs ?? '')]) {
    if (!utvonal) continue;
    const kepHiba = kepUtvonalHiba(utvonal);
    if (kepHiba) { hiba(kepHiba); continue; }
    if (tavoliKep(utvonal)) {
      info(`Távoli kép: ${utvonal} – a meglétét nem tudjuk ellenőrizni.`);
    } else if (kepek.length && !kepek.includes(utvonal)) {
      hiba(`Ez a kép nincs a repóban: ${utvonal} – töltsd fel, vagy javítsd az útvonalat.`);
    }
  }

  /* --- törzs ----------------------------------------------------------- */
  const torzs = (piszkozat.torzs ?? '').trim();
  if (!torzs) figyelmeztetes('A cikk törzse üres.');
  else if (/^#\s/m.test(torzs)) {
    figyelmeztetes('Egyszintű (#) címsor van a szövegben: a cikk címét a fejléc adja, a szövegben ##-tól kezdd.');
  }
  if (/\[\^\d+\]/.test(torzs)) {
    figyelmeztetes('Lábjegyzet-jelölést ([^1]) találtam: a lap ezt szó szerint kiírja, nem alakítja lábjegyzetté.');
  }

  return uzenetek;
}

export function vanHiba(uzenetek) {
  return uzenetek.some((u) => u.szint === 'hiba');
}

/* ------------------------------------------------------------------------ */

/** Csak kis- és nagybetűben vagy ékezetben eltérő rovat/címke. */
function hasonloak(piszkozat, cikkek) {
  const uzenetek = [];
  const ismertRovatok = new Set(cikkek.map((c) => c.section).filter(Boolean));
  const ismertCimkek = new Set(cikkek.flatMap((c) => c.tags ?? []));

  const rovat = (piszkozat.section ?? '').trim();
  const rovatParja = kozeliParja(rovat, ismertRovatok);
  if (rovatParja) {
    uzenetek.push(`A „${rovat}" rovat csak írásmódban tér el a meglévő „${rovatParja}"-tól – így két külön rovat lesz belőlük.`);
  }

  for (const cimke of piszkozat.tags ?? []) {
    const parja = kozeliParja(cimke, ismertCimkek);
    if (parja) {
      uzenetek.push(`A „${cimke}" címke csak írásmódban tér el a meglévő „${parja}"-tól.`);
    }
  }
  return uzenetek;
}

function kozeliParja(ertek, ismertek) {
  const tiszta = String(ertek ?? '').trim();
  if (!tiszta || ismertek.has(tiszta)) return null;
  const kulcs = normalizalt(tiszta);
  for (const ismert of ismertek) {
    if (normalizalt(ismert) === kulcs) return ismert;
  }
  return null;
}

function napKulonbseg(datumSzoveg, ma) {
  const mikor = new Date(`${datumSzoveg}T12:00:00`);
  const a = Date.UTC(mikor.getFullYear(), mikor.getMonth(), mikor.getDate());
  const b = Date.UTC(ma.getFullYear(), ma.getMonth(), ma.getDate());
  return Math.round((b - a) / 86400000);
}
