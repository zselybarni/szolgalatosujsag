/** Egy cikk nézete: fejléc, borítókép, törzs, és ajánló a végén. */

import { LAP } from './config.js';
import { cikkBetolt } from './content.js';
import { elem, ikon, urit } from './dom.js';
import { datumHosszu, relativDatum } from './format.js';

export async function cikkNezet(tarolo, slug, mindenCikk) {
  const { meta, html } = await cikkBetolt(slug);
  cikkRajzol(tarolo, meta, html, mindenCikk);
  document.title = `${meta.title} · ${LAP.nev}`;
}

/**
 * A cikk kirajzolása kész adatokból. A lap a `cikkNezet`-en keresztül hívja
 * (az tölti le a cikket), a szerkesztő pedig közvetlenül, a még el sem mentett
 * piszkozattal – így az előnézet nem egy hasonmás, hanem maga a cikkoldal.
 *
 * @param {{ navigacio?: boolean }} beallitas a szerkesztőben a vissza-hivatkozás
 *   és az ajánló csak zavarna, ezért kikapcsolható.
 */
export function cikkRajzol(tarolo, meta, html, mindenCikk, { navigacio = true } = {}) {
  urit(tarolo);

  tarolo.append(
    navigacio
      ? elem('a', { osztaly: 'vissza', href: '#/' }, [
        ikon('ikon-vissza', 'vissza__ikon'),
        elem('span', { szoveg: 'Vissza a hírfolyamhoz' }),
      ])
      : null,
    elem('article', { osztaly: 'cikk' }, [
      elem('header', { osztaly: 'cikk__fej' }, [
        elem('div', { osztaly: 'jelolok' }, [
          meta.section
            ? elem('a', {
              osztaly: 'rovat-cimke rovat-cimke--link',
              href: `#/rovat/${encodeURIComponent(meta.section)}`,
              szoveg: meta.section,
            })
            : null,
          elem('span', { osztaly: 'jelolok__ido', szoveg: relativDatum(meta.date) }),
        ]),
        elem('h1', { osztaly: 'cikk__cim', szoveg: meta.title }),
        meta.lead ? elem('p', { osztaly: 'cikk__lead', szoveg: meta.lead }) : null,
        elem('p', { osztaly: 'cikk__meta', szoveg: metaSzoveg(meta) }),
      ]),
      meta.cover
        ? elem('figure', { osztaly: 'cikk__borito' }, [
          elem('img', { src: meta.cover, alt: meta.coverAlt ?? '', decoding: 'async' }),
          meta.coverAlt ? elem('figcaption', { szoveg: meta.coverAlt }) : null,
        ])
        : null,
      elem('div', { osztaly: 'cikk__torzs', html }),
      cimkeSav(meta),
    ]),
    navigacio ? ajanlo(meta, mindenCikk) : null,
  );
}

function metaSzoveg(meta) {
  const reszek = [datumHosszu(meta.date)];
  if (meta.author) reszek.push(meta.author);
  if (meta.readingMinutes) reszek.push(`${meta.readingMinutes} perc olvasás`);
  return reszek.join(' · ');
}

function cimkeSav(meta) {
  if (!meta.tags?.length) return null;
  return elem('ul', { osztaly: 'cimkek' }, meta.tags.map((cimke) => elem('li', {}, [
    elem('span', { osztaly: 'cimke', szoveg: `#${cimke}` }),
  ])));
}

function ajanlo(meta, mindenCikk) {
  const jeloltek = mindenCikk
    .filter((cikk) => cikk.slug !== meta.slug)
    .map((cikk) => ({
      cikk,
      pont: (cikk.section === meta.section ? 2 : 0)
        + (cikk.tags ?? []).filter((c) => (meta.tags ?? []).includes(c)).length,
    }))
    .sort((a, b) => b.pont - a.pont)
    .slice(0, 3)
    .map((tetel) => tetel.cikk);

  if (!jeloltek.length) return null;

  return elem('section', { osztaly: 'ajanlo' }, [
    elem('h2', { osztaly: 'ajanlo__cim', szoveg: 'Olvasd el ezt is' }),
    elem('ul', { osztaly: 'ajanlo__lista' }, jeloltek.map((cikk) => elem('li', {}, [
      elem('a', { osztaly: 'ajanlo__tetel', href: `#/cikk/${cikk.slug}` }, [
        elem('span', { osztaly: 'ajanlo__ido', szoveg: relativDatum(cikk.date) }),
        elem('span', { osztaly: 'ajanlo__szoveg', szoveg: cikk.title }),
      ]),
    ]))),
  ]);
}
