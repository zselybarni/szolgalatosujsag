/**
 * A frissítési ajánlat felirata.
 *
 * Ez az egyetlen hely, ahol a lap magától megszólítja az olvasót, ezért számít,
 * hogy pontosan mondja: új cikkről vagy csak módosulásról van-e szó.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { frissitesSzoveg } from '../assets/js/frissites.js';

test('egyetlen új cikkről egyes számban szól', () => {
  assert.equal(frissitesSzoveg([{ slug: 'a' }]), 'Új cikk érkezett – megnézem');
});

test('több új cikket megszámol', () => {
  assert.equal(frissitesSzoveg([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]), '3 új cikk érkezett – megnézem');
});

test('a módosult cikket megnevezi, mert a kártyáján semmi sem látszana belőle', () => {
  assert.equal(frissitesSzoveg([], [{ title: 'A C50-eseink' }]), 'Frissült: A C50-eseink – megnézem');
});

test('a hosszú címet megrövidíti, hogy elférjen a gombon', () => {
  const szoveg = frissitesSzoveg([], [{ title: 'Nosztalgiavonat gőzössel a Hárs-hegyi alagúton át' }]);
  assert.ok(szoveg.startsWith('Frissült: Nosztalgiavonat gőzössel a'), szoveg);
  assert.ok(szoveg.endsWith('… – megnézem'), `nem jelzi a rövidítést: ${szoveg}`);
  assert.ok(szoveg.length < 55, `túl hosszú felirat (${szoveg.length}): ${szoveg}`);
});

test('több módosult cikket megszámol', () => {
  assert.equal(frissitesSzoveg([], [{ title: 'a' }, { title: 'b' }]), '2 cikk frissült – megnézem');
});

test('az új cikk erősebb hír a módosultnál', () => {
  assert.equal(frissitesSzoveg([{ slug: 'uj' }], [{ title: 'régi' }]), 'Új cikk érkezett – megnézem');
});

test('máskülönben – például törlésnél – általánosan szól', () => {
  assert.equal(frissitesSzoveg([], []), 'Frissült a lap – megnézem');
  assert.equal(frissitesSzoveg(), 'Frissült a lap – megnézem');
});
