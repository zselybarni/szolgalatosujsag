/**
 * A tartalombetöltés gyorsítótár-szabályai.
 *
 * A GitHub Pages tíz percig frissnek mondja a .json és .md fájlokat, és ezt a
 * fejlécet statikus tárhelyen nem tudjuk átírni. Így azon múlik minden, hogy a
 * kliens hogyan kér: a jegyzéket mindig újraellenőrizteti, a cikkek törzsét
 * pedig a jegyzékbeli verzióval kéri. Ha ez elromlik, az olvasó napokig a
 * tegnapi lapot látja – ezért van rá teszt.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cikkForras, cikkTorzsLetolt, jegyzekBetolt } from '../assets/js/content.js';

/** A globális fetch cseréje: rögzíti a hívásokat, és kész választ ad. */
function fetchFigyelo(torzs = '') {
  const hivasok = [];
  globalThis.fetch = async (cim, beallitas = {}) => {
    hivasok.push({ cim, beallitas });
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(torzs || '{}'),
      text: async () => torzs,
    };
  };
  return hivasok;
}

test('a cikkjegyzéket mindig újraellenőrizteti a kiszolgálóval', async () => {
  const hivasok = fetchFigyelo(JSON.stringify({ cikkek: [] }));
  await jegyzekBetolt();

  assert.equal(hivasok.length, 1);
  assert.match(hivasok[0].cim, /content\/index\.json$/);
  assert.equal(hivasok[0].beallitas.cache, 'no-cache', 'a jegyzék jöhetne a böngésző régi másolatából');
});

test('hálózati hiba esetén a mentett példány is jobb az üres lapnál', async () => {
  const hivasok = [];
  let elso = true;
  globalThis.fetch = async (cim, beallitas = {}) => {
    hivasok.push(beallitas.cache ?? 'alapertelmezett');
    // Az ellenőriztetett kérés hálózatot kér; offline ez elszáll.
    if (elso) { elso = false; throw new TypeError('Failed to fetch'); }
    return { ok: true, status: 200, json: async () => ({ cikkek: [] }) };
  };

  // A jegyzék memoizálva van, ezért friss modulpéldányt kérünk.
  const { jegyzekBetolt: ujraBetolt } = await import(`../assets/js/content.js?proba=${Date.now()}`);
  await ujraBetolt();
  assert.deepEqual(hivasok, ['no-cache', 'alapertelmezett']);
});

test('a cikk törzse a jegyzékbeli verzióval kérődik le', async () => {
  const hivasok = fetchFigyelo('---\ntitle: Teszt\n---\n\nSzöveg.\n');
  const meta = { path: 'content/cikkek/2026-08-26-teszt.md', verzio: 'a1b2c3d4' };

  assert.equal(await cikkTorzsLetolt(meta), '---\ntitle: Teszt\n---\n\nSzöveg.\n');
  assert.equal(hivasok[0].cim, 'content/cikkek/2026-08-26-teszt.md?v=a1b2c3d4');
  // Verziózott címnél a gyorsítótár nyugodtan dolgozhat: a cím maga változik.
  assert.equal(hivasok[0].beallitas.cache, undefined);
});

test('verzió nélküli jegyzéknél a kiszolgáló mondja meg, változott-e', async () => {
  const hivasok = fetchFigyelo('---\ntitle: Teszt\n---\n');
  await cikkTorzsLetolt({ path: 'content/cikkek/regi.md' });

  assert.equal(hivasok[0].cim, 'content/cikkek/regi.md');
  assert.equal(hivasok[0].beallitas.cache, 'no-cache');
});

test('a cikkforrás címe a verzióval bővül, anélkül pedig érintetlen marad', () => {
  assert.equal(cikkForras({ path: 'content/cikkek/a.md', verzio: 'abc12345' }), 'content/cikkek/a.md?v=abc12345');
  assert.equal(cikkForras({ path: 'content/cikkek/a.md' }), 'content/cikkek/a.md');
  assert.equal(cikkForras({ path: 'content/cikkek/a.md', verzio: null }), 'content/cikkek/a.md');
});

/* --- visszatérés a félretett laphoz -------------------------------------- */

/** Friss modulpéldány: a jegyzék memoizálva van, tesztenként újat kérünk. */
async function frissModul() {
  return import(`../assets/js/content.js?proba=${Math.random()}`);
}

/** A megadott jegyzékeket adja sorban; `null` helyett hálózati hibát dob. */
function jegyzekekSorban(...jegyzekek) {
  const sor = [...jegyzekek];
  globalThis.fetch = async () => {
    const kovetkezo = sor.length > 1 ? sor.shift() : sor[0];
    if (kovetkezo === null) throw new TypeError('Failed to fetch');
    return { ok: true, status: 200, json: async () => kovetkezo };
  };
}

const cikk = (slug, verzio) => ({ slug, path: `content/cikkek/${slug}.md`, title: slug, date: '2020-01-01', verzio });

test('a visszatérő olvasónál észreveszi az új cikket', async () => {
  jegyzekekSorban({ cikkek: [cikk('regi', 'a1')] }, { cikkek: [cikk('regi', 'a1'), cikk('uj', 'b2')] });
  const { jegyzekBetolt: betolt, jegyzekUjratolt: ujratolt } = await frissModul();

  assert.equal((await betolt()).cikkek.length, 1);
  const eredmeny = await ujratolt();

  assert.equal(eredmeny.valtozott, true);
  assert.deepEqual(eredmeny.ujCikkek.map((c) => c.slug), ['uj']);
  assert.equal(eredmeny.cikkek.length, 2);
  // A friss jegyzék lép a memóriában tartott helyébe.
  assert.equal((await betolt()).cikkek.length, 2);
});

test('változatlan jegyzéknél nincs mit jelenteni', async () => {
  jegyzekekSorban({ cikkek: [cikk('regi', 'a1')] });
  const { jegyzekBetolt: betolt, jegyzekUjratolt: ujratolt } = await frissModul();

  await betolt();
  const eredmeny = await ujratolt();
  assert.equal(eredmeny.valtozott, false);
  assert.deepEqual(eredmeny.ujCikkek, []);
});

test('a módosított cikket a verzió árulja el', async () => {
  jegyzekekSorban({ cikkek: [cikk('regi', 'a1')] }, { cikkek: [cikk('regi', 'c3')] });
  const { jegyzekBetolt: betolt, jegyzekUjratolt: ujratolt } = await frissModul();

  await betolt();
  const eredmeny = await ujratolt();
  assert.equal(eredmeny.valtozott, true, 'a megváltozott törzs nem tűnt fel');
  assert.deepEqual(eredmeny.ujCikkek, [], 'a módosítás nem új cikk');
  assert.deepEqual(eredmeny.valtozottCikkek.map((c) => c.slug), ['regi']);
});

test('törölt cikknél is szól, pedig nincs se új, se módosult', async () => {
  jegyzekekSorban({ cikkek: [cikk('a', 'a1'), cikk('b', 'b1')] }, { cikkek: [cikk('a', 'a1')] });
  const { jegyzekBetolt: betolt, jegyzekUjratolt: ujratolt } = await frissModul();

  await betolt();
  const eredmeny = await ujratolt();
  assert.equal(eredmeny.valtozott, true);
  assert.deepEqual(eredmeny.ujCikkek, []);
  assert.deepEqual(eredmeny.valtozottCikkek, []);
});

test('hálózati hiba esetén megmarad a mostani jegyzék', async () => {
  jegyzekekSorban({ cikkek: [cikk('regi', 'a1')] }, null);
  const { jegyzekBetolt: betolt, jegyzekUjratolt: ujratolt } = await frissModul();

  await betolt();
  await assert.rejects(() => ujratolt());
  // A lap nem maradhat jegyzék nélkül attól, hogy egy ellenőrzés elszállt.
  assert.equal((await betolt()).cikkek.length, 1);
});

test('a hibás választ érthető üzenettel jelzi', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await assert.rejects(() => cikkTorzsLetolt({ path: 'nincs.md' }), /nem tölthető be \(404\)/);
});
