/**
 * A mérés csendes útja.
 *
 * A lényeg nem az, hogy mit küld – azt böngészőben látni –, hanem hogy a
 * hiányzó vagy hibázó `gtag` sose ronthassa el a lapot: a mérőkód a legtöbb
 * blokkolóban egyszerűen nincs ott.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { esemeny } from '../assets/js/meres.js';

test('gtag nélkül csendben elmarad a mérés', () => {
  delete globalThis.gtag;
  assert.doesNotThrow(() => esemeny('cikk_megnyitas', { cikk_slug: 'proba' }));
});

test('a gtag hibáját elnyeli', () => {
  globalThis.gtag = () => { throw new Error('blokkolva'); };
  assert.doesNotThrow(() => esemeny('cikk_megnyitas'));
});

test('az eseményt névvel és paraméterekkel adja tovább', () => {
  const hivasok = [];
  globalThis.gtag = (...ervek) => hivasok.push(ervek);

  esemeny('cikk_megnyitas', { cikk_cim: 'Ballagóknak', rovat: 'Tábor', honnan: 'kartya' });

  assert.deepEqual(hivasok, [['event', 'cikk_megnyitas', {
    cikk_cim: 'Ballagóknak', rovat: 'Tábor', honnan: 'kartya',
  }]]);
});

test('a hosszú címet levágja, mert a GA4 száz jelig tartja meg', () => {
  const hivasok = [];
  globalThis.gtag = (...ervek) => hivasok.push(ervek);

  esemeny('cikk_megnyitas', { cikk_cim: 'á'.repeat(140), masodperc: 42 });

  const adatok = hivasok[0][2];
  assert.equal(adatok.cikk_cim.length, 100);
  assert.equal(adatok.masodperc, 42, 'a számot nem szabad szövegként csonkolni');
  delete globalThis.gtag;
});
