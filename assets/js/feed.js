/**
 * A hírfolyam: vezető cikk, rovatválasztó és a cikkrács.
 */

import { HIRFOLYAM } from './config.js';
import { rovatok } from './content.js';
import { elem, urit } from './dom.js';
import { datumHosszu, relativDatum } from './format.js';

export function hirfolyamNezet(tarolo, { cikkek, rovat = null }) {
  urit(tarolo);

  if (!cikkek.length) {
    tarolo.append(uresAllapot());
    return;
  }

  const szurt = rovat
    ? cikkek.filter((cikk) => cikk.section === rovat)
    : cikkek;

  if (rovat && !szurt.length) {
    tarolo.append(rovatFejlec(rovat, 0), uresAllapot(`Ebben a rovatban még nincs cikk.`));
    return;
  }

  tarolo.append(rovatSav(cikkek, rovat));

  if (rovat) {
    tarolo.append(rovatFejlec(rovat, szurt.length), racs(szurt, 0));
    return;
  }

  const vezeto = szurt.find((cikk) => cikk.featured) ?? szurt[0];
  const tobbi = szurt.filter((cikk) => cikk !== vezeto);
  tarolo.append(vezetoCikk(vezeto), racs(tobbi, HIRFOLYAM.elsoAdag));
}

/* --- részek ------------------------------------------------------------- */

function rovatSav(cikkek, aktiv) {
  const lista = rovatok(cikkek);
  if (!lista.length) return document.createDocumentFragment();

  return elem('nav', { osztaly: 'rovatsav', 'aria-label': 'Rovatok' }, [
    elem('a', {
      osztaly: `rovatsav__elem${aktiv ? '' : ' rovatsav__elem--aktiv'}`,
      href: '#/',
      szoveg: 'Minden hír',
    }),
    ...lista.map(({ nev, darab }) => elem('a', {
      osztaly: `rovatsav__elem${aktiv === nev ? ' rovatsav__elem--aktiv' : ''}`,
      href: `#/rovat/${encodeURIComponent(nev)}`,
    }, [
      elem('span', { szoveg: nev }),
      elem('span', { osztaly: 'rovatsav__darab', szoveg: String(darab) }),
    ])),
  ]);
}

function rovatFejlec(rovat, darab) {
  return elem('header', { osztaly: 'rovatfej' }, [
    elem('h1', { osztaly: 'rovatfej__cim', szoveg: rovat }),
    elem('p', {
      osztaly: 'rovatfej__alcim',
      szoveg: darab === 1 ? '1 cikk ebben a rovatban' : `${darab} cikk ebben a rovatban`,
    }),
  ]);
}

function vezetoCikk(cikk) {
  return elem('a', {
    osztaly: `vezeto${cikk.cover ? '' : ' vezeto--kep-nelkul'}`,
    href: `#/cikk/${cikk.slug}`,
  }, [
    cikk.cover
      ? elem('div', { osztaly: 'vezeto__kep' }, [
        elem('img', { src: cikk.cover, alt: cikk.coverAlt ?? '', loading: 'eager', decoding: 'async' }),
      ])
      : null,
    elem('div', { osztaly: 'vezeto__szoveg' }, [
      elem('div', { osztaly: 'jelolok' }, [
        cikk.section ? elem('span', { osztaly: 'rovat-cimke', szoveg: cikk.section }) : null,
        elem('span', { osztaly: 'jelolok__ido', szoveg: relativDatum(cikk.date) }),
      ]),
      elem('h1', { osztaly: 'vezeto__cim', szoveg: cikk.title }),
      cikk.lead ? elem('p', { osztaly: 'vezeto__lead', szoveg: cikk.lead }) : null,
      elem('p', { osztaly: 'vezeto__meta', szoveg: metaSzoveg(cikk) }),
    ]),
  ]);
}

function racs(cikkek, kezdetiDarab) {
  const doboz = elem('section', { osztaly: 'racs-doboz', 'aria-label': 'További cikkek' });
  if (!cikkek.length) return doboz;

  const racsElem = elem('div', { osztaly: 'racs' });
  const hatra = elem('div', { osztaly: 'tovabbiak' });
  doboz.append(racsElem, hatra);

  let latszik = 0;
  const adag = kezdetiDarab || cikkek.length;

  const kirajzol = (mennyit) => {
    const vege = Math.min(cikkek.length, latszik + mennyit);
    for (let i = latszik; i < vege; i += 1) racsElem.append(kartya(cikkek[i]));
    latszik = vege;

    urit(hatra);
    if (latszik < cikkek.length) {
      hatra.append(elem('button', {
        type: 'button',
        osztaly: 'gomb gomb--tovabb',
        szoveg: `Továbbiak (${cikkek.length - latszik})`,
        onclick: () => kirajzol(HIRFOLYAM.tovabbiAdag),
      }));
    }
  };

  kirajzol(adag);
  return doboz;
}

function kartya(cikk) {
  return elem('article', { osztaly: 'kartya' }, [
    elem('a', { osztaly: 'kartya__link', href: `#/cikk/${cikk.slug}` }, [
      cikk.cover
        ? elem('div', { osztaly: 'kartya__kep' }, [
          elem('img', { src: cikk.cover, alt: cikk.coverAlt ?? '', loading: 'lazy', decoding: 'async' }),
        ])
        : elem('div', { osztaly: 'kartya__betu', 'aria-hidden': 'true' }, [
          elem('span', { szoveg: (cikk.section ?? cikk.title).slice(0, 1).toUpperCase() }),
        ]),
      elem('div', { osztaly: 'kartya__szoveg' }, [
        elem('div', { osztaly: 'jelolok' }, [
          cikk.section ? elem('span', { osztaly: 'rovat-cimke', szoveg: cikk.section }) : null,
          elem('span', { osztaly: 'jelolok__ido', szoveg: relativDatum(cikk.date) }),
        ]),
        elem('h2', { osztaly: 'kartya__cim', szoveg: cikk.title }),
        cikk.lead ? elem('p', { osztaly: 'kartya__lead', szoveg: cikk.lead }) : null,
        elem('p', { osztaly: 'kartya__meta', szoveg: metaSzoveg(cikk) }),
      ]),
    ]),
  ]);
}

function metaSzoveg(cikk) {
  const reszek = [datumHosszu(cikk.date)];
  if (cikk.author) reszek.push(cikk.author);
  if (cikk.readingMinutes) reszek.push(`${cikk.readingMinutes} perc olvasás`);
  return reszek.join(' · ');
}

function uresAllapot(uzenet = 'Még egy cikk sem jelent meg. Tegyél egy .md fájlt a content/cikkek mappába!') {
  return elem('div', { osztaly: 'ures' }, [
    elem('p', { osztaly: 'ures__cim', szoveg: 'Üres a hírfolyam' }),
    elem('p', { osztaly: 'ures__szoveg', szoveg: uzenet }),
  ]);
}
