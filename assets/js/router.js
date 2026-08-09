/**
 * Hash-alapú útválasztás.
 *
 * A GitHub Pages projektoldal tetszőleges alkönyvtárban él, és nincs mód
 * szerveroldali átirányításra, ezért az útvonal a `#` mögött utazik – így a
 * mély hivatkozások frissítés után is működnek, bárhová kerül a lap.
 *
 *   #/                      – hírfolyam
 *   #/rovat/<rovat>         – egy rovat cikkei
 *   #/cikk/<slug>           – egy cikk
 */

import { LAP } from './config.js';
import { jegyzekBetolt } from './content.js';
import { cikkNezet } from './article.js';
import { elem, urit } from './dom.js';
import { hirfolyamNezet } from './feed.js';

export function utvalasztoInditas(tarolo) {
  const kezel = () => valt(tarolo).catch((hiba) => hibaNezet(tarolo, hiba));
  window.addEventListener('hashchange', kezel);
  kezel();
}

async function valt(tarolo) {
  const utvonal = ertelmez(window.location.hash);
  tarolo.setAttribute('aria-busy', 'true');

  const { cikkek } = await jegyzekBetolt();

  if (utvonal.nezet === 'cikk') {
    await cikkNezet(tarolo, utvonal.slug, cikkek);
  } else {
    document.title = utvonal.rovat ? `${utvonal.rovat} · ${LAP.nev}` : `${LAP.nev} – ${LAP.alcim}`;
    hirfolyamNezet(tarolo, { cikkek, rovat: utvonal.rovat });
  }

  tarolo.removeAttribute('aria-busy');
  gorgetes(utvonal);
}

function ertelmez(hash) {
  const nyers = hash.replace(/^#\/?/, '');
  const reszek = nyers.split('/').filter(Boolean).map(decodeURIComponent);

  if (reszek[0] === 'cikk' && reszek[1]) return { nezet: 'cikk', slug: reszek[1], rovat: null };
  if (reszek[0] === 'rovat' && reszek[1]) return { nezet: 'hirfolyam', rovat: reszek[1], slug: null };
  return { nezet: 'hirfolyam', rovat: null, slug: null };
}

function gorgetes(utvonal) {
  // Cikkre lépve az elejére ugrunk; a hírfolyamban maradunk, ahol voltunk.
  if (utvonal.nezet === 'cikk' || utvonal.rovat) {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
}

function hibaNezet(tarolo, hiba) {
  console.error(hiba);
  urit(tarolo).append(elem('div', { osztaly: 'ures' }, [
    elem('p', { osztaly: 'ures__cim', szoveg: 'Ez a lap nem érhető el' }),
    elem('p', { osztaly: 'ures__szoveg', szoveg: hiba.message }),
    elem('p', {}, [elem('a', { osztaly: 'gomb', href: '#/', szoveg: 'Vissza a hírfolyamhoz' })]),
  ]));
  tarolo.removeAttribute('aria-busy');
}
