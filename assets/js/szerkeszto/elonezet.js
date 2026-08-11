/**
 * Előnézetek.
 *
 * Mind a négy a lap **valódi** függvényeit hívja (`cikkRajzol`, `vezetoCikk`,
 * `kartya`, `tetelElem`) a valódi stíluslappal, ezért nem hasonmás: ha a
 * kártya megjelenése változik, az előnézet magától követi.
 */

import { cikkRajzol } from '../article.js';
import { markdownRenderel } from '../content.js';
import { elem, urit } from '../dom.js';
import { kartya, vezetoCikk } from '../feed.js';
import { leadSzarmaztat } from '../lead.js';
import { tetelElem } from '../ticker.js';
import { maiNap } from './allapot.js';

const NEZETEK = [
  { kulcs: 'cikk', nev: 'Cikkoldal' },
  { kulcs: 'vezeto', nev: 'Vezető cikk' },
  { kulcs: 'kartya', nev: 'Kártya' },
  { kulcs: 'hirsav', nev: 'Hírsáv' },
  { kulcs: 'markdown', nev: 'Markdown' },
];

export function elonezetEpit(tarolo, { markdownForras, mindenCikk = [] }) {
  let aktiv = 'cikk';
  const szin = elem('div', { osztaly: 'szerk-szin' });
  const fulek = elem('div', { osztaly: 'szerk-fulek', role: 'tablist' },
    NEZETEK.map(({ kulcs, nev }) => elem('button', {
      type: 'button', osztaly: 'szerk-ful', role: 'tab', adat: { nezet: kulcs }, szoveg: nev,
      onclick: () => { aktiv = kulcs; fulekFrissit(); utolsoRajzol(); },
    })));

  tarolo.append(fulek, szin);

  let utolsoPiszkozat = null;
  fulekFrissit();

  return { frissit };

  function frissit(piszkozat) {
    utolsoPiszkozat = piszkozat;
    const cikk = metaLetrehoz(piszkozat);
    urit(szin);

    if (aktiv === 'markdown') {
      szin.append(elem('pre', { osztaly: 'szerk-markdown' }, [
        elem('code', { szoveg: markdownForras() }),
      ]));
      return;
    }

    if (aktiv === 'cikk') {
      const doboz = elem('div', { osztaly: 'tartalom szerk-lap' });
      szin.append(doboz);
      cikkRajzol(doboz, cikk, markdownRenderel(piszkozat.torzs ?? ''), mindenCikk, { navigacio: false });
      return;
    }

    if (aktiv === 'vezeto') {
      szin.append(elem('div', { osztaly: 'tartalom szerk-lap' }, [vezetoCikk(cikk)]));
      return;
    }

    if (aktiv === 'kartya') {
      szin.append(elem('div', { osztaly: 'tartalom szerk-lap' }, [
        elem('div', { osztaly: 'racs szerk-racs' }, [kartya(cikk)]),
      ]));
      return;
    }

    // Hírsáv: a szalag egy tételét a valódi szalagon belül mutatjuk.
    szin.append(elem('div', { osztaly: 'hirsav szerk-hirsav' }, [
      elem('span', { osztaly: 'hirsav__cimke', szoveg: 'Friss hírek' }),
      elem('div', { osztaly: 'hirsav__ablak' }, [
        elem('div', { osztaly: 'hirsav__futo' }, [
          elem('div', { osztaly: 'hirsav__csoport' }, [tetelElem(cikk)]),
        ]),
      ]),
    ]));
  }

  function utolsoRajzol() {
    if (utolsoPiszkozat) frissit(utolsoPiszkozat);
  }

  function fulekFrissit() {
    for (const gomb of fulek.querySelectorAll('.szerk-ful')) {
      const kivalasztott = gomb.dataset.nezet === aktiv;
      gomb.classList.toggle('szerk-ful--aktiv', kivalasztott);
      gomb.setAttribute('aria-selected', String(kivalasztott));
    }
  }
}

/**
 * A piszkozatból olyan objektumot csinál, amilyet a jegyzék adna – a lap
 * rajzoló függvényei ezt várják.
 */
function metaLetrehoz(piszkozat) {
  const torzs = piszkozat.torzs ?? '';
  const lead = (piszkozat.lead ?? '').trim() || leadSzarmaztat(torzs);
  const szoSzam = torzs.split(/\s+/).filter(Boolean).length;

  return {
    slug: piszkozat.slug || 'elonezet',
    title: (piszkozat.title ?? '').trim() || 'A cikk címe',
    date: /^\d{4}-\d{2}-\d{2}$/.test(piszkozat.date ?? '') ? piszkozat.date : maiNap(),
    lead,
    author: piszkozat.author || null,
    section: piszkozat.section || null,
    tags: piszkozat.tags ?? [],
    cover: piszkozat.cover || null,
    coverAlt: piszkozat.coverAlt || null,
    featured: !!piszkozat.featured,
    readingMinutes: Math.max(1, Math.round(szoSzam / 200)),
  };
}
