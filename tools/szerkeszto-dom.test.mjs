/**
 * A szerkesztő összeszerelésének füstpróbája igazi DOM-mal.
 *
 * A `jsdom` fejlesztői segédeszköz, nincs a package.json-ban – ha nincs
 * telepítve (például a GitHub Actions futtatásakor), a próba kimarad, nem
 * bukik el. Helyi futtatáshoz:  npm install --no-save jsdom
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GYOKER = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let JSDOM = null;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  // nincs telepítve – a próbát kihagyjuk
}

test('a szerkesztő felépül, és a beírt cím végigfut az előnézeten', { skip: !JSDOM && 'jsdom nincs telepítve' }, async (t) => {
  /** Minden kérés, amit a szerkesztő indított – a gyorsítótár-szabályokhoz. */
  const keresek = [];
  const html = await readFile(join(GYOKER, 'szerkeszto.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost:4173/szerkeszto.html', pretendToBeVisual: true });
  const { window } = dom;

  // A jsdom nem valósítja meg a matchMedia-t; a témaváltó ezt kérdezi.
  window.matchMedia = window.matchMedia ?? ((kerdes) => ({
    matches: false,
    media: kerdes,
    addEventListener() {},
    removeEventListener() {},
  }));

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  // A navigator a Node-ban csak getter, ezért felülírni csak így lehet.
  globalBeallit('navigator', window.navigator);
  globalThis.requestAnimationFrame = (fuggveny) => setTimeout(fuggveny, 0);
  // A lapon is használt, bemásolt marked – így az előnézet valódi HTML-t kap.
  globalThis.marked = await markedBetolt();
  globalThis.fetch = (cim, beallitas) => {
    keresek.push({ cim: String(cim), beallitas: beallitas ?? {} });
    return fajlKiszolgalo(cim);
  };

  await import('../assets/js/szerkeszto/main.js');
  await varj();

  const keres = (resz) => keresek.filter((k) => k.cim.includes(resz));
  const $ = (valaszto) => window.document.querySelector(valaszto);
  const $$ = (valaszto) => [...window.document.querySelectorAll(valaszto)];

  await t.test('az űrlap és a listák felépültek', () => {
    assert.ok($$('#urlap input').length >= 8, 'kevés bemeneti mező');
    const rovatChipek = $$('.szerk-chipsor--keszlet .szerk-chip').map((e) => e.textContent);
    assert.ok(rovatChipek.includes('Vasút'), `nincs Vasút a rovatok között: ${rovatChipek}`);
    assert.equal($$('.szerk-kep:not(.szerk-kep--nincs)').length, 3, 'nem a három repóbeli kép jelent meg');
    assert.equal($$('#cikk-valaszto option').length, 8, 'a meglévő cikkek listája nem stimmel');
  });

  await t.test('cím beírására frissül a fájlnév, az előnézet és a kimenet', () => {
    const cimMezo = $('#urlap input[placeholder="A cikk címe"]');
    const datum = $('#urlap input[type="date"]').value;
    cimMezo.value = 'Őszi menetrend a Gyermekvasúton';
    cimMezo.dispatchEvent(new window.Event('input', { bubbles: true }));

    assert.equal($('.szerk-input--mono').value, `${datum}-oszi-menetrend-a-gyermekvasuton`);
    assert.equal($('#fajl-nev').textContent, `content/cikkek/${datum}-oszi-menetrend-a-gyermekvasuton.md`);
    assert.equal($('#elonezet .cikk__cim').textContent, 'Őszi menetrend a Gyermekvasúton');
  });

  await t.test('az elhagyott blokkok helyén nem marad „null" szöveg', () => {
    // Az append(null) beszúrna egy „null" szövegcsomót; a hozzafuz() ezt szűri.
    assert.ok(!$('#elonezet').textContent.includes('null'), $('#elonezet').textContent.slice(0, 120));
  });

  await t.test('a szövegdoboz formázottan ír, a nyers Markdown nincs szem előtt', () => {
    assert.ok($('.szerk-iras'), 'nincs formázott írófelület');
    assert.equal($('.szerk-iras').getAttribute('contenteditable'), 'true');
    assert.ok($('.szerk-textarea--torzs').hidden, 'a nyers Markdown látszik');
  });

  await t.test('a formázott szövegből Markdown lesz, és bekerül az előnézetbe', () => {
    const iras = $('.szerk-iras');
    iras.innerHTML = '<h2>Az új időpontok</h2><p>Szeptembertől <strong>óránként</strong> járnak a vonatok.</p>';
    iras.dispatchEvent(new window.Event('input', { bubbles: true }));

    // A piszkozatba Markdown kerül, nem HTML.
    const forras = $('.szerk-textarea--torzs');
    assert.equal(forras.value, '## Az új időpontok\n\nSzeptembertől **óránként** járnak a vonatok.');
    assert.match($('#elonezet .cikk__torzs').textContent, /Szeptembertől óránként/);
    assert.equal($('#elonezet .cikk__torzs h2')?.textContent, 'Az új időpontok');
    assert.equal($('#elonezet .cikk__torzs strong')?.textContent, 'óránként');
  });

  await t.test('a Forrás módban a nyers Markdown szerkeszthető', () => {
    const forrasGomb = $$('.szerk-eszkoz').find((g) => g.textContent === 'Forrás');
    forrasGomb.dispatchEvent(new window.Event('click', { bubbles: true }));
    assert.ok(!$('.szerk-textarea--torzs').hidden, 'a Forrás mód nem nyílt meg');
    assert.ok($('.szerk-iras').hidden, 'a formázott felület nem tűnt el');

    // A forrásban írt szöveg megjelenik az előnézetben. (A Markdown-értelmező
    // itt egy egyszerű helyettesítő, ezért a nyers szöveget keressük.)
    const forras = $('.szerk-textarea--torzs');
    forras.value = 'Szeptembertől óránként járnak a vonatok.';
    forras.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.match($('#elonezet .cikk__torzs').textContent, /Szeptembertől óránként/);

    forrasGomb.dispatchEvent(new window.Event('click', { bubbles: true }));
    assert.ok(!$('.szerk-iras').hidden, 'nem tért vissza a formázott felület');
    assert.match($('.szerk-iras').textContent, /Szeptembertől óránként/, 'a formázott felület nem vette át a szöveget');
  });

  await t.test('a címke gombra kattintva bekerül a cikkbe', () => {
    const cimkeGomb = $$('.szerk-szakasz')
      .find((sz) => sz.textContent.includes('Elérhető címkék'))
      .querySelector('.szerk-chipsor--keszlet .szerk-chip');
    const cimke = cimkeGomb.textContent;
    cimkeGomb.dispatchEvent(new window.Event('click', { bubbles: true }));
    const kivalasztott = $$('.szerk-chip--aktiv').map((e) => e.textContent.replace(/[#×]/g, ''));
    assert.ok(kivalasztott.includes(cimke), `a ${cimke} címke nem került be: ${kivalasztott}`);
  });

  await t.test('a Markdown fül a kész fájlt mutatja', () => {
    const markdownFul = $$('.szerk-ful').find((f) => f.textContent === 'Markdown');
    markdownFul.dispatchEvent(new window.Event('click', { bubbles: true }));
    const forras = $('.szerk-markdown').textContent;
    assert.match(forras, /^---\ntitle: Őszi menetrend a Gyermekvasúton\n/);
    assert.match(forras, /Szeptembertől óránként járnak a vonatok\./);
  });

  await t.test('a hibátlan piszkozatnál a kimeneti gombok élnek', () => {
    const gombok = $$('[data-kimenet]');
    assert.ok(gombok.length >= 3, `kevés kimeneti gomb: ${gombok.length}`);
    assert.ok(gombok.every((g) => !g.disabled), 'valamelyik gomb tiltva maradt');
  });

  await t.test('üres címnél hibát jelez és letiltja a kimenetet', () => {
    const cimMezo = $('#urlap input[placeholder="A cikk címe"]');
    cimMezo.value = '';
    cimMezo.dispatchEvent(new window.Event('input', { bubbles: true }));

    const hibak = $$('.szerk-uzenet--hiba').map((e) => e.textContent);
    assert.ok(hibak.some((h) => h.includes('A cím kötelező')), `nem jelezte a hiányzó címet: ${hibak}`);
    assert.ok($$('[data-kimenet]').every((g) => g.disabled), 'hibás piszkozatnál is aktív maradt egy gomb');
  });

  await t.test('a token soha nem kerül a mentett piszkozatba', () => {
    const tokenMezo = $('#token');
    tokenMezo.value = 'github_pat_teszt';
    tokenMezo.dispatchEvent(new window.Event('input', { bubbles: true }));

    const mentett = window.localStorage.getItem('hirfolyam:szerkeszto-piszkozat') ?? '';
    assert.ok(!mentett.includes('github_pat_teszt'), 'a token bekerült a piszkozatba');
  });

  await t.test('a jegyzékek és a megnyitott cikk sosem a böngésző másolatából jönnek', async () => {
    for (const jegyzek of ['content/index.json', 'content/images.json', 'content/rovatok.json']) {
      const kerdes = keres(jegyzek).at(0);
      assert.ok(kerdes, `nem kérte le: ${jegyzek}`);
      assert.equal(kerdes.beallitas.cache, 'no-cache', `${jegyzek} jöhetne a gyorsítótárból`);
    }
  });

  await t.test('a törlés gomb csak a repóban lévő cikknél él', async () => {
    const torles = $('#torles');
    assert.ok(torles, 'nincs törlés gomb a kimenetben');
    assert.ok(torles.disabled, 'a be nem küldött piszkozatnál is aktív a törlés');

    // Meglévő cikk betöltése a legördülő listából.
    const valaszto = $('#cikk-valaszto');
    valaszto.value = valaszto.options[1].value;
    valaszto.dispatchEvent(new window.Event('change', { bubbles: true }));
    await varj();

    assert.equal($('#fajl-nev').textContent, `content/cikkek/${valaszto.value}.md`);
    assert.ok(!torles.disabled, 'betöltött cikknél sem lehetett törölni');
    assert.match(torles.title, /törlése a repóból/);

    // A szerkesztésre megnyitott törzs vagy verziózott címről jön, vagy a
    // kiszolgálótól – régi másolatból soha, mert azt írnánk vissza a repóba.
    const torzsKeres = keres(`${valaszto.value}.md`).at(-1);
    assert.ok(torzsKeres, 'nem kérte le a cikk törzsét');
    assert.ok(
      /\?v=/.test(torzsKeres.cim) || torzsKeres.beallitas.cache === 'no-cache',
      `a cikk törzse a gyorsítótárból is jöhetett: ${torzsKeres.cim}`,
    );
  });

  dom.window.close();
});

function globalBeallit(nev, ertek) {
  try {
    Object.defineProperty(globalThis, nev, { value: ertek, configurable: true, writable: true });
  } catch { /* nem baj: a próba nem használja */ }
}

/** A `vendor/marked.min.js` betöltése – ugyanaz a példány, amit a lap használ. */
async function markedBetolt() {
  const forras = await readFile(join(GYOKER, 'vendor', 'marked.min.js'), 'utf8');
  const modul = { exports: {} };
  new Function('module', 'exports', forras)(modul, modul.exports);
  return modul.exports.marked ?? modul.exports;
}

/** A böngésző fetch-e helyett a lemezről olvasunk. */
async function fajlKiszolgalo(cim) {
  // A cikkek címe verziót visz (`?v=…`), a lemezen viszont csak a fájl van.
  const utvonal = String(cim).replace(/\?.*$/, '').replace(/^\.\//, '').replace(/^https?:\/\/[^/]+\//, '');
  try {
    const tartalom = await readFile(join(GYOKER, utvonal), 'utf8');
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(tartalom),
      text: async () => tartalom,
    };
  } catch {
    return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  }
}

function varj(ms = 60) {
  return new Promise((kesz) => setTimeout(kesz, ms));
}
