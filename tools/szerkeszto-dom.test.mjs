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
  // A Markdown-értelmezőt nem itt teszteljük, csak a bekötését.
  globalThis.marked = { parse: (szoveg) => `<p>${szoveg}</p>` };
  globalThis.fetch = fajlKiszolgalo;

  await import('../assets/js/szerkeszto/main.js');
  await varj();

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

  await t.test('a törzs a cikkoldal előnézetébe kerül', () => {
    const torzsMezo = $('.szerk-textarea--torzs');
    torzsMezo.value = 'Szeptembertől óránként járnak a vonatok.';
    torzsMezo.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.match($('#elonezet .cikk__torzs').textContent, /Szeptembertől óránként/);
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
    assert.deepEqual($$('[data-kimenet]').map((g) => g.disabled), [false, false, false]);
  });

  await t.test('üres címnél hibát jelez és letiltja a kimenetet', () => {
    const cimMezo = $('#urlap input[placeholder="A cikk címe"]');
    cimMezo.value = '';
    cimMezo.dispatchEvent(new window.Event('input', { bubbles: true }));

    const hibak = $$('.szerk-uzenet--hiba').map((e) => e.textContent);
    assert.ok(hibak.some((h) => h.includes('A cím kötelező')), `nem jelezte a hiányzó címet: ${hibak}`);
    assert.deepEqual($$('[data-kimenet]').map((g) => g.disabled), [true, true, true]);
  });

  dom.window.close();
});

function globalBeallit(nev, ertek) {
  try {
    Object.defineProperty(globalThis, nev, { value: ertek, configurable: true, writable: true });
  } catch { /* nem baj: a próba nem használja */ }
}

/** A böngésző fetch-e helyett a lemezről olvasunk. */
async function fajlKiszolgalo(cim) {
  const utvonal = String(cim).replace(/^\.\//, '').replace(/^https?:\/\/[^/]+\//, '');
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
