import { test } from 'node:test';
import assert from 'node:assert/strict';

import { frontmatterBont } from '../assets/js/frontmatter.js';

test('kiolvassa a skalárokat és elválasztja a törzset', () => {
  const { adat, torzs } = frontmatterBont(
    '---\ntitle: Rekord a vonalon\ndate: 2026-08-09\nfeatured: true\n---\n\nElső bekezdés.\n',
  );
  assert.equal(adat.title, 'Rekord a vonalon');
  assert.equal(adat.date, '2026-08-09');
  assert.equal(adat.featured, true);
  assert.equal(torzs, 'Első bekezdés.');
});

test('a sorbeli és a soronkénti listát is tömbként adja vissza', () => {
  const sorbeli = frontmatterBont('---\ntags: [vasút, tábor]\n---\n').adat;
  const soronkenti = frontmatterBont('---\ntags:\n  - vasút\n  - tábor\n---\n').adat;
  assert.deepEqual(sorbeli.tags, ['vasút', 'tábor']);
  assert.deepEqual(soronkenti.tags, ['vasút', 'tábor']);
});

test('a > blokkot egy sorrá vonja össze, a | blokk sortöréseit megtartja', () => {
  const osszevont = frontmatterBont('---\nlead: >\n  Első sor\n  második sor\n---\n').adat;
  const megtartott = frontmatterBont('---\nlead: |\n  Első sor\n  második sor\n---\n').adat;
  assert.equal(osszevont.lead, 'Első sor második sor');
  assert.equal(megtartott.lead, 'Első sor\nmásodik sor');
});

test('az idézőjeles érték kettőspontot is tartalmazhat', () => {
  const { adat } = frontmatterBont('---\ntitle: "Menetrend: így készül"\n---\n');
  assert.equal(adat.title, 'Menetrend: így készül');
});

test('az idézőjel megvédi a kettős keresztet is', () => {
  const { adat } = frontmatterBont('---\ntitle: "Vonat # 3 érkezik"\n---\n');
  assert.equal(adat.title, 'Vonat # 3 érkezik');
});

test('idézőjel nélkül a kettős kereszt utáni rész megjegyzés', () => {
  const { adat } = frontmatterBont('---\ntitle: Vonat érkezik # ezt ne olvasd\n---\n');
  assert.equal(adat.title, 'Vonat érkezik');
});

test('front matter nélküli fájl teljes egészében törzs', () => {
  const { adat, torzs } = frontmatterBont('Csak szöveg.\n');
  assert.deepEqual(adat, {});
  assert.equal(torzs, 'Csak szöveg.');
});

test('a lezáratlan front matter hibát dob', () => {
  assert.throws(() => frontmatterBont('---\ntitle: Csonka\n\nTörzs.\n'), /lezáró/);
});

test('az értelmezhetetlen sor hibát dob', () => {
  assert.throws(() => frontmatterBont('---\nez nem kulcs érték\n---\n'), /Értelmezhetetlen/);
});
