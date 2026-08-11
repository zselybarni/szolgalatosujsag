/**
 * A piszkozat mentésének szabályai.
 *
 * A lényeg, amit védünk: egy meglévő cikk **megnyitása** ne hozzon létre
 * „félbehagyott piszkozatot" – csak a tényleges szerkesztés.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// A modul localStorage-ot használ; a Node-ban ezt pótolnunk kell.
const tar = new Map();
globalThis.localStorage = {
  getItem: (kulcs) => (tar.has(kulcs) ? tar.get(kulcs) : null),
  setItem: (kulcs, ertek) => tar.set(kulcs, String(ertek)),
  removeItem: (kulcs) => tar.delete(kulcs),
};

const KULCS = 'hirfolyam:szerkeszto-piszkozat';
const { allapotLetrehoz, uresPiszkozat } = await import('../assets/js/szerkeszto/allapot.js');

/** A mentés késleltetett, ezért megvárjuk. */
const mentesreVar = () => new Promise((kesz) => setTimeout(kesz, 500));

const CIKK = {
  title: 'Felújították a virágvölgyi peront',
  date: '2026-07-15',
  slug: '2026-07-15-felujitottak-a-viragvolgyi-peront',
  eredetiSlug: '2026-07-15-felujitottak-a-viragvolgyi-peront',
  torzs: 'Virágvölgy a vonal egyik keresztezőállomása.',
};

test('az érintetlen üres piszkozat nem kerül mentésre', async () => {
  tar.clear();
  const allapot = allapotLetrehoz();
  allapot.frissit({});
  await mentesreVar();
  assert.equal(allapot.mentettBetolt(), null);
});

test('meglévő cikk megnyitása nem hoz létre piszkozatot', async () => {
  tar.clear();
  const allapot = allapotLetrehoz();
  allapot.csere(CIKK);
  await mentesreVar();
  assert.equal(tar.get(KULCS), undefined, 'a puszta megnyitás mentett');
  assert.equal(allapot.mentettBetolt(), null);
});

test('a betöltött cikk szerkesztése viszont mentődik', async () => {
  tar.clear();
  const allapot = allapotLetrehoz();
  allapot.csere(CIKK);
  allapot.frissit({ title: 'Nem újították fel a virágvölgyi peront' });
  await mentesreVar();

  const mentett = allapot.mentettBetolt();
  assert.ok(mentett, 'a szerkesztés nem mentődött');
  assert.equal(mentett.piszkozat.title, 'Nem újították fel a virágvölgyi peront');
  assert.ok(mentett.mentve > 0, 'nincs időbélyeg');
});

test('a visszaállított piszkozat lesz az új alap, nem mentődik újra', async () => {
  tar.clear();
  const allapot = allapotLetrehoz();
  allapot.csere({ ...CIKK, title: 'Munka közben' });
  allapot.frissit({ torzs: 'Új szöveg.' });
  await mentesreVar();

  const elso = tar.get(KULCS);
  const masodik = allapotLetrehoz();
  masodik.csere(allapot.mentettBetolt().piszkozat);
  await mentesreVar();
  assert.equal(tar.get(KULCS), elso, 'a folytatás felülírta a mentést');
});

test('a két hétnél régebbi piszkozatot nem ajánlja fel', () => {
  tar.clear();
  const regi = Date.now() - 15 * 86400000;
  tar.set(KULCS, JSON.stringify({ mentve: regi, piszkozat: { ...uresPiszkozat(), title: 'Régi' } }));
  assert.equal(allapotLetrehoz().mentettBetolt(), null);
});

test('a régi, időbélyeg nélküli mentést is elfogadja', () => {
  tar.clear();
  tar.set(KULCS, JSON.stringify({ ...uresPiszkozat(), title: 'Időbélyeg nélkül' }));
  const mentett = allapotLetrehoz().mentettBetolt();
  assert.equal(mentett.piszkozat.title, 'Időbélyeg nélkül');
});

test('az eldobás után nincs mit felajánlani', async () => {
  tar.clear();
  const allapot = allapotLetrehoz();
  allapot.csere(CIKK);
  allapot.frissit({ title: 'Módosítva' });
  await mentesreVar();
  allapot.mentettTorol();
  assert.equal(allapot.mentettBetolt(), null);
});
