/**
 * A GitHub-kliens tesztjei. A `kerdez` (fetch) cserélhető, ezért a teljes
 * logika – meglévő fájl felismerése, sha kezelése, hibaüzenetek – hálózat
 * nélkül ellenőrizhető.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { base64Szoveg, githubKliens, hibabol } from '../assets/js/szerkeszto/github.js';

const REPO = { tulajdonos: 'zselybarni', nev: 'szolgalatosujsag', ag: 'main' };

/** Egyszerű hamis kiszolgáló: útvonal+metódus → válasz. */
function hamisKerdez(valaszok) {
  const hivasok = [];
  const kerdez = async (cim, beallitas = {}) => {
    const metodus = beallitas.method ?? 'GET';
    hivasok.push({ cim, metodus, fejlec: beallitas.headers ?? {}, torzs: beallitas.body });
    const kulcs = `${metodus} ${cim}`;
    const valasz = valaszok[kulcs] ?? valaszok[metodus] ?? { status: 500, adat: {} };
    return {
      ok: valasz.status >= 200 && valasz.status < 300,
      status: valasz.status,
      json: async () => valasz.adat ?? {},
    };
  };
  return { kerdez, hivasok };
}

const ALAP = 'https://api.github.com/repos/zselybarni/szolgalatosujsag';

test('a repóellenőrzés visszaadja a nevet és az írási jogot', async () => {
  const { kerdez } = hamisKerdez({
    [`GET ${ALAP}`]: { status: 200, adat: { full_name: 'zselybarni/szolgalatosujsag', permissions: { push: true } } },
  });
  const adat = await githubKliens({ token: 't', repo: REPO, kerdez }).repoEllenoriz();
  assert.equal(adat.nev, 'zselybarni/szolgalatosujsag');
  assert.equal(adat.irhat, true);
});

test('írási jog nélküli tokennél az irhat hamis', async () => {
  const { kerdez } = hamisKerdez({
    [`GET ${ALAP}`]: { status: 200, adat: { full_name: 'x/y', permissions: { push: false } } },
  });
  assert.equal((await githubKliens({ token: 't', repo: REPO, kerdez }).repoEllenoriz()).irhat, false);
});

test('a token az Authorization fejlécben megy, a címben nem', async () => {
  const { kerdez, hivasok } = hamisKerdez({
    [`GET ${ALAP}`]: { status: 200, adat: { full_name: 'x/y' } },
  });
  await githubKliens({ token: 'titkos-token', repo: REPO, kerdez }).repoEllenoriz();
  assert.equal(hivasok[0].fejlec.Authorization, 'Bearer titkos-token');
  assert.ok(!hivasok[0].cim.includes('titkos-token'), 'a token bekerült a címbe');
});

test('új fájlnál nincs sha a beküldésben', async () => {
  const cim = `${ALAP}/contents/content/cikkek/uj.md`;
  const { kerdez, hivasok } = hamisKerdez({
    [`GET ${cim}?ref=main`]: { status: 404, adat: { message: 'Not Found' } },
    [`PUT ${cim}`]: { status: 201, adat: { commit: { html_url: 'https://github.com/x/y/commit/abc' } } },
  });

  const eredmeny = await githubKliens({ token: 't', repo: REPO, kerdez })
    .fajlKiir({ utvonal: 'content/cikkek/uj.md', base64: 'YWJj', uzenet: 'Új cikk' });

  assert.equal(eredmeny.uj, true);
  assert.equal(eredmeny.commitCim, 'https://github.com/x/y/commit/abc');
  const torzs = JSON.parse(hivasok.at(-1).torzs);
  assert.equal(torzs.sha, undefined);
  assert.equal(torzs.branch, 'main');
  assert.equal(torzs.content, 'YWJj');
});

test('meglévő fájlnál a mostani sha-t küldi, hogy ne írjon vakon felül', async () => {
  const cim = `${ALAP}/contents/content/cikkek/van.md`;
  const { kerdez, hivasok } = hamisKerdez({
    [`GET ${cim}?ref=main`]: { status: 200, adat: { sha: 'abc123' } },
    [`PUT ${cim}`]: { status: 200, adat: { commit: { html_url: 'https://github.com/x/y/commit/def' } } },
  });

  const eredmeny = await githubKliens({ token: 't', repo: REPO, kerdez })
    .fajlKiir({ utvonal: 'content/cikkek/van.md', base64: 'YWJj', uzenet: 'Módosítás' });

  assert.equal(eredmeny.uj, false);
  assert.equal(JSON.parse(hivasok.at(-1).torzs).sha, 'abc123');
});

test('a hibás tokent érthető mondattal jelzi', async () => {
  const { kerdez } = hamisKerdez({ [`GET ${ALAP}`]: { status: 401, adat: { message: 'Bad credentials' } } });
  await assert.rejects(
    () => githubKliens({ token: 'rossz', repo: REPO, kerdez }).repoEllenoriz(),
    /érvénytelen vagy lejárt/,
  );
});

test('az ütközést nem nyeli le, hanem újratöltésre kér', () => {
  assert.match(hibabol({ status: 409 }).message, /közben megváltozott/);
  assert.match(hibabol({ status: 403 }).message, /írási jogot/);
  assert.match(hibabol({ status: 404 }).message, /nem található/);
});

test('a base64 az ékezetes szöveget is helyesen kódolja', () => {
  const forras = '---\ntitle: Őszi menetrend\n---\n\nHűvösvölgy.\n';
  const kodolt = base64Szoveg(forras);
  assert.equal(Buffer.from(kodolt, 'base64').toString('utf8'), forras);
});
