/**
 * A lapfej bal sarkában ülő időjárás-jelző, és a rákattintásra nyíló
 * állomásonkénti előrejelzés.
 */

import { TABOR } from './config.js';
import { elem, ikon, urit } from './dom.js';
import { csapadek, fok, napNev, ora, tavolsag } from './format.js';
import { idojarasBetolt } from './weather.js';
import { felhozetSzoveg, ikonAzonosito, leiras } from './wmo.js';

export function idojarasInditas() {
  const gomb = document.getElementById('idojaras-gomb');
  const ablak = document.getElementById('allomas-ablak');
  const lista = document.getElementById('allomas-lista');
  const frissites = document.getElementById('allomas-frissites');
  if (!gomb || !ablak) return;

  let allapot = null;

  gomb.addEventListener('click', () => {
    if (!allapot) return;
    allomasokRajzol(lista, allapot);
    frissites.textContent = frissitesSzoveg(allapot);
    if (!ablak.open) ablak.showModal();
  });

  document.getElementById('allomas-ablak-bezar')
    ?.addEventListener('click', () => ablak.close());

  // Kattintás a párbeszédablakon kívülre = bezárás.
  ablak.addEventListener('click', (esemeny) => {
    if (esemeny.target !== ablak) return;
    const doboz = ablak.getBoundingClientRect();
    const kivul = esemeny.clientX < doboz.left || esemeny.clientX > doboz.right
      || esemeny.clientY < doboz.top || esemeny.clientY > doboz.bottom;
    if (kivul) ablak.close();
  });

  betolt();
  // Amikor a lap újra előtérbe kerül, frissítünk – a cache úgyis megvédi az API-t.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') betolt();
  });

  async function betolt() {
    try {
      allapot = await idojarasBetolt();
      pillRajzol(gomb, allapot);
      if (ablak.open) {
        allomasokRajzol(lista, allapot);
        frissites.textContent = frissitesSzoveg(allapot);
      }
    } catch {
      hibaRajzol(gomb);
    }
  }
}

function pillRajzol(gomb, allapot) {
  const { jelenlegi } = allapot.tabor;
  gomb.disabled = false;
  gomb.classList.toggle('idojaras--elavult', allapot.elavult);

  urit(gomb).append(
    ikon(ikonAzonosito(jelenlegi), 'idojaras__ikon'),
    elem('span', { osztaly: 'idojaras__adatok' }, [
      elem('span', { osztaly: 'idojaras__hofok', szoveg: fok(jelenlegi.homerseklet) }),
      elem('span', { osztaly: 'idojaras__reszlet' }, [
        elem('span', { szoveg: `${Math.round(jelenlegi.felhozet)}%` }),
        elem('span', { osztaly: 'idojaras__pont', 'aria-hidden': 'true', szoveg: '·' }),
        elem('span', { szoveg: csapadek(jelenlegi.csapadek) }),
      ]),
    ]),
    elem('span', { osztaly: 'idojaras__hely', szoveg: TABOR.rovidNev }),
  );

  gomb.setAttribute(
    'aria-label',
    `${TABOR.nev}: ${fok(jelenlegi.homerseklet)}C, ${felhozetSzoveg(jelenlegi.felhozet)}, `
    + `csapadék ${csapadek(jelenlegi.csapadek)}. Megnyitás: állomásonkénti előrejelzés.`,
  );
}

function hibaRajzol(gomb) {
  gomb.disabled = true;
  urit(gomb).append(
    ikon('ikon-felho', 'idojaras__ikon'),
    elem('span', { osztaly: 'idojaras__adatok' }, [
      elem('span', { osztaly: 'idojaras__hofok', szoveg: '–' }),
      elem('span', { osztaly: 'idojaras__reszlet', szoveg: 'nincs adat' }),
    ]),
  );
  gomb.setAttribute('aria-label', 'Az időjárás-előrejelzés jelenleg nem érhető el.');
}

function allomasokRajzol(tarolo, allapot) {
  urit(tarolo).append(
    taborSor(allapot.tabor),
    elem('ol', { osztaly: 'vonal' }, allapot.allomasok.map(allomasSor)),
  );
}

function taborSor(tabor) {
  return elem('div', { osztaly: 'tabor-kartya' }, [
    elem('div', { osztaly: 'tabor-kartya__fej' }, [
      ikon(ikonAzonosito(tabor.jelenlegi), 'tabor-kartya__ikon'),
      elem('div', {}, [
        elem('p', { osztaly: 'tabor-kartya__nev', szoveg: TABOR.nev }),
        elem('p', {
          osztaly: 'tabor-kartya__allapot',
          szoveg: `${leiras(tabor.jelenlegi.weatherCode)} · felhőzet ${Math.round(tabor.jelenlegi.felhozet)}% · ${csapadek(tabor.jelenlegi.csapadek)}`,
        }),
      ]),
      elem('p', { osztaly: 'tabor-kartya__hofok', szoveg: fok(tabor.jelenlegi.homerseklet) }),
    ]),
    elem('ul', { osztaly: 'napsor' }, tabor.napok.map((nap, i) => elem('li', { osztaly: 'napsor__elem' }, [
      elem('span', { osztaly: 'napsor__nev', szoveg: i === 0 ? 'ma' : napNev(nap.nap) }),
      ikon(ikonAzonosito({ weatherCode: nap.weatherCode, cloudCover: 0, isDay: true }), 'napsor__ikon'),
      elem('span', { osztaly: 'napsor__hofok' }, [
        elem('strong', { szoveg: fok(nap.max) }),
        elem('span', { osztaly: 'napsor__min', szoveg: fok(nap.min) }),
      ]),
    ]))),
  ]);
}

function allomasSor(allomas) {
  const ma = allomas.napok[0];
  const { jelenlegi } = allomas;

  return elem('li', { osztaly: 'vonal__allomas' }, [
    elem('span', { osztaly: 'vonal__jel', 'aria-hidden': 'true' }),
    elem('div', { osztaly: 'vonal__nev' }, [
      elem('span', { osztaly: 'vonal__cim', szoveg: allomas.nev }),
      elem('span', { osztaly: 'vonal__tav', szoveg: tavolsag(allomas.tav) }),
    ]),
    ikon(ikonAzonosito(jelenlegi), 'vonal__ikon'),
    elem('div', { osztaly: 'vonal__ertekek' }, [
      elem('span', { osztaly: 'vonal__hofok', szoveg: fok(jelenlegi.homerseklet) }),
      elem('span', { osztaly: 'vonal__masodlagos' }, [
        elem('span', { szoveg: `${Math.round(jelenlegi.felhozet)}%` }),
        elem('span', { osztaly: 'vonal__csepp' }, [
          ikon('ikon-csepp', 'vonal__csepp-ikon'),
          elem('span', { szoveg: csapadek(jelenlegi.csapadek) }),
        ]),
      ]),
    ]),
    elem('span', {
      osztaly: 'vonal__mamax',
      szoveg: ma ? `${fok(ma.max)} / ${fok(ma.min)}` : '',
      title: 'Mai maximum / minimum',
    }),
  ]);
}

function frissitesSzoveg(allapot) {
  const mikor = ora(allapot.lekerdezve);
  return allapot.elavult
    ? `Mentett adat ${mikor}-kor · a frissítés most nem sikerült`
    : `Frissítve ${mikor} · adatforrás: Open-Meteo`;
}
