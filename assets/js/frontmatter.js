/**
 * A cikkek fejlécét (front matter) olvassa ki. Szándékosan a YAML egy szűk,
 * kiszámítható részhalmazát ismeri: skalárok, sorbeli és tömbszerű listák,
 * valamint `|` / `>` blokkok. Így nem kell YAML-könyvtárat behúzni, és
 * ugyanez a modul fut a böngészőben és az indexelő Node-szkriptben is.
 *
 * Ha egy sor nem illeszkedik a támogatott formákra, hibát dobunk – az
 * indexelés így elbukik a fordításnál, nem pedig csendben hibás adatot ad.
 */

const HATAROLO = /^---\r?\n/;

/**
 * @param {string} nyers a .md fájl teljes tartalma
 * @returns {{ adat: Record<string, unknown>, torzs: string }}
 */
export function frontmatterBont(nyers) {
  const szoveg = nyers.replace(/^﻿/, '');
  if (!HATAROLO.test(szoveg)) {
    return { adat: {}, torzs: szoveg.trim() };
  }

  const sorok = szoveg.split(/\r?\n/);
  let zaro = -1;
  for (let i = 1; i < sorok.length; i += 1) {
    if (sorok[i].trim() === '---') { zaro = i; break; }
  }
  if (zaro === -1) {
    throw new Error('A front matter nyitó "---" jelét nem követi lezáró "---" sor.');
  }

  return {
    adat: fejlecFeldolgoz(sorok.slice(1, zaro)),
    torzs: sorok.slice(zaro + 1).join('\n').trim(),
  };
}

function fejlecFeldolgoz(sorok) {
  const adat = {};
  let i = 0;

  while (i < sorok.length) {
    const sor = sorok[i];
    if (!sor.trim() || sor.trim().startsWith('#')) { i += 1; continue; }

    const talalat = /^([A-Za-z_][\w-]*)\s*:\s?(.*)$/.exec(sor);
    if (!talalat) {
      throw new Error(`Értelmezhetetlen front matter sor: ${JSON.stringify(sor)}`);
    }

    const [, kulcs, nyersErtek] = talalat;
    const ertek = nyersErtek.trim();
    i += 1;

    if (ertek === '|' || ertek === '>' || ertek === '|-' || ertek === '>-') {
      const { blokk, kovetkezo } = blokkOlvas(sorok, i);
      adat[kulcs] = ertek.startsWith('>') ? blokk.replace(/\s*\n\s*/g, ' ').trim() : blokk;
      i = kovetkezo;
      continue;
    }

    if (ertek === '') {
      const { elemek, kovetkezo } = listaOlvas(sorok, i);
      adat[kulcs] = elemek;
      i = kovetkezo;
      continue;
    }

    adat[kulcs] = skalar(ertek);
  }

  return adat;
}

function blokkOlvas(sorok, kezdet) {
  const gyujtott = [];
  let i = kezdet;
  while (i < sorok.length && (sorok[i].trim() === '' || /^\s{2,}\S/.test(sorok[i]))) {
    gyujtott.push(sorok[i].replace(/^\s{2}/, ''));
    i += 1;
  }
  while (gyujtott.length && gyujtott[gyujtott.length - 1].trim() === '') gyujtott.pop();
  return { blokk: gyujtott.join('\n'), kovetkezo: i };
}

function listaOlvas(sorok, kezdet) {
  const elemek = [];
  let i = kezdet;
  while (i < sorok.length && /^\s*-\s+/.test(sorok[i])) {
    elemek.push(skalar(sorok[i].replace(/^\s*-\s+/, '').trim()));
    i += 1;
  }
  if (!elemek.length) {
    throw new Error('Üres érték: a kulcs után se skalár, se lista nem következik.');
  }
  return { elemek, kovetkezo: i };
}

function skalar(nyers) {
  const nyersTiszta = nyers.trim();

  // Az idézőjel mindent megvéd, a megjegyzés-jelölést is: a "hír # 3" cím
  // értéke a teljes szöveg. Ezért a megjegyzést csak idézőjel nélküli
  // értékből vágjuk le – különben a záró idézőjel is odalenne.
  if (/^".*"$/.test(nyersTiszta) || /^'.*'$/.test(nyersTiszta)) {
    return nyersTiszta.slice(1, -1).replace(/\\"/g, '"');
  }

  const ertek = nyersTiszta.replace(/\s+#\s.*$/, '').trim();
  if (/^\[.*\]$/.test(ertek)) {
    const belso = ertek.slice(1, -1).trim();
    return belso ? belso.split(',').map((e) => skalar(e.trim())) : [];
  }
  if (ertek === 'true') return true;
  if (ertek === 'false') return false;
  if (ertek === 'null' || ertek === '~' || ertek === '') return null;
  if (/^-?\d+(\.\d+)?$/.test(ertek)) return Number(ertek);
  return ertek;
}
