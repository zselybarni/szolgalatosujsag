/**
 * Friss hírek – a lapfej alatti futó szalag.
 *
 * Tartalma az elmúlt HIRSAV.napok napban megjelent cikk, legfeljebb
 * HIRSAV.maxTetel darab. Ha ebben az ablakban nincs cikk, a szalag nem marad
 * üresen: a legfrissebb néhány cím kerül rá "a lap korábbi számaiból" jelzéssel.
 *
 * A végtelenített mozgást a lista kétszeri kirajzolása adja: a sáv a saját
 * szélessége feléig csúszik, majd ugrás nélkül újraindul.
 */

import { HIRSAV } from './config.js';
import { elem, urit } from './dom.js';
import { napKulonbseg, datum, relativDatum } from './format.js';

const PIXEL_PER_MASODPERC = 55;

export function hirsavKirajzol(cikkek) {
  const sav = document.getElementById('hirsav');
  const futo = document.getElementById('hirsav-futo');
  if (!sav || !futo) return;

  const { tetelek, tartalek } = valogat(cikkek);
  if (!tetelek.length) {
    sav.hidden = true;
    return;
  }

  sav.hidden = false;
  sav.classList.toggle('hirsav--tartalek', tartalek);
  sav.querySelector('.hirsav__cimke').textContent = tartalek ? HIRSAV.tartalekCimke : HIRSAV.cimke;

  const csoport = () => elem('div', { osztaly: 'hirsav__csoport' }, tetelek.map(tetelElem));
  urit(futo).append(csoport(), csoport());

  // A sebesség a tartalom hosszához igazodik, hogy 3 és 30 cím is olvasható legyen.
  requestAnimationFrame(() => {
    const szelesseg = futo.scrollWidth / 2;
    if (!szelesseg) return;
    futo.style.setProperty('--hirsav-ido', `${Math.max(18, szelesseg / PIXEL_PER_MASODPERC)}s`);
    futo.classList.add('hirsav__futo--mozog');
  });
}

function tetelElem(cikk) {
  return elem('a', {
    osztaly: 'hirsav__tetel',
    href: `#/cikk/${cikk.slug}`,
  }, [
    elem('span', { osztaly: 'hirsav__ido', szoveg: relativDatum(cikk.date) }),
    elem('span', { osztaly: 'hirsav__valaszto', 'aria-hidden': 'true' }),
    elem('span', { osztaly: 'hirsav__cim', szoveg: cikk.title }),
  ]);
}

/**
 * @returns {{ tetelek: object[], tartalek: boolean }}
 */
function valogat(cikkek, most = new Date()) {
  const frissek = cikkek.filter((cikk) => {
    const eltelt = napKulonbseg(datum(cikk.date), most);
    return eltelt >= 0 && eltelt < HIRSAV.napok;
  });

  if (frissek.length) {
    return { tetelek: frissek.slice(0, HIRSAV.maxTetel), tartalek: false };
  }
  return { tetelek: cikkek.slice(0, HIRSAV.tartalekTetel), tartalek: true };
}
