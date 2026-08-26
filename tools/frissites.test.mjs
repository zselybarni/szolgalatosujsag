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

test('új cikk nélküli változásról általánosan szól', () => {
  assert.equal(frissitesSzoveg([]), 'Frissült a lap – megnézem');
  assert.equal(frissitesSzoveg(), 'Frissült a lap – megnézem');
});
