import { test } from 'node:test';
import assert from 'node:assert/strict';

import { leadSzarmaztat, leadTordel } from '../assets/js/lead.js';

test('az első bekezdésből készít leadet', () => {
  const lead = leadSzarmaztat('Első bekezdés két mondattal. A második itt van.\n\nMásodik bekezdés.');
  assert.equal(lead, 'Első bekezdés két mondattal. A második itt van.');
});

test('átlépi a címet, a képet, a listát és az idézetet', () => {
  const torzs = [
    '## Alcím',
    '',
    '![Egy kép](content/images/kep.svg)',
    '',
    '- lista elem',
    '',
    '> idézet',
    '',
    'Ez a valódi első bekezdés.',
  ].join('\n');
  assert.equal(leadSzarmaztat(torzs), 'Ez a valódi első bekezdés.');
});

test('kiszedi a Markdown-jelöléseket, a hivatkozás szövegét megtartja', () => {
  const lead = leadSzarmaztat('A **vonal** [Hűvösvölgyig](https://pelda.hu) tart, `11,2` _km_ hosszan.');
  assert.equal(lead, 'A vonal Hűvösvölgyig tart, 11,2 km hosszan.');
});

test('a többsoros bekezdést egyetlen sorrá vonja össze', () => {
  assert.equal(leadSzarmaztat('Első sor\nmásodik sor.'), 'Első sor második sor.');
});

test('mondathatáron rövidít, ha van értelmes vágási pont', () => {
  const elso = `${'szó '.repeat(30)}vége.`;
  const lead = leadSzarmaztat(`${elso} Ez a mondat már kimarad.`, 140);
  assert.ok(lead.endsWith('vége.'), `váratlan vég: ${lead}`);
  assert.ok(lead.length <= 140);
});

test('mondathatár híján szóhatáron vág, és három ponttal zár', () => {
  const lead = leadSzarmaztat(`${'hosszúszó '.repeat(30)}vég`, 100);
  assert.ok(lead.endsWith('…'));
  assert.ok(lead.length <= 101);
  assert.ok(!lead.includes('hosszúsz…'), 'szó közepén vágott');
});

test('üres törzsre üres leadet ad', () => {
  assert.equal(leadSzarmaztat('\n\n'), '');
});

test('a rövid lead egyetlen sor marad', () => {
  assert.deepEqual(leadTordel('Rövid ajánló.', 76), ['Rövid ajánló.']);
});

test('a tördelt sorok beleférnek a keretbe, és kiegyenlítettek', () => {
  const szoveg = 'Az augusztus első hétvégéjén közlekedő vonatok minden eddiginél több '
    + 'utast szállítottak Széchenyihegy és Hűvösvölgy között, a forgalmi szolgálat '
    + 'pedig két szerelvénnyel dolgozott.';
  const sorok = leadTordel(szoveg, 76);

  assert.ok(sorok.length >= 2);
  for (const sor of sorok) assert.ok(sor.length <= 76, `túl hosszú sor: ${sor}`);

  const legrovidebb = Math.min(...sorok.map((sor) => sor.length));
  const leghosszabb = Math.max(...sorok.map((sor) => sor.length));
  assert.ok(leghosszabb - legrovidebb < 25, `egyenetlen tördelés: ${sorok.map((s) => s.length)}`);
});

test('nem hagy egybetűs szót a sor végén, ha van jobb tördelés', () => {
  const szoveg = 'Az augusztus első hétvégéjén közlekedő vonatok minden eddiginél '
    + 'több utast szállítottak Széchenyihegy és Hűvösvölgy között. A forgalmi '
    + 'szolgálat hétvégenként két szerelvénnyel dolgozik.';
  const sorok = leadTordel(szoveg, 76);

  const arvak = sorok.slice(0, -1).filter((sor) => sor.split(' ').pop().length <= 2);
  assert.deepEqual(arvak, [], `sorvégi árva szó: ${sorok.join(' | ')}`);
});

test('a tördelés nem veszít és nem told be szöveget', () => {
  const szoveg = 'Egy kettő három négy öt hat hét nyolc kilenc tíz tizenegy tizenkettő '
    + 'tizenhárom tizennégy tizenöt tizenhat tizenhét tizennyolc.';
  assert.equal(leadTordel(szoveg, 40).join(' '), szoveg);
});

test('a keretnél hosszabb szót nem vágja szét', () => {
  const sorok = leadTordel('rövid megszentségteleníthetetlenségeskedéseitekért rövid', 20);
  assert.ok(sorok.some((sor) => sor.includes('megszentségteleníthetetlenségeskedéseitekért')));
});
