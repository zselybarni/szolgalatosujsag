/** Dátum- és szövegformázás magyarul, egy helyen. */

import { LAP } from './config.js';

const HOSSZU = new Intl.DateTimeFormat(LAP.nyelv, {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: LAP.idozona,
});
const ROVID = new Intl.DateTimeFormat(LAP.nyelv, {
  month: 'short', day: 'numeric', timeZone: LAP.idozona,
});
const ORA = new Intl.DateTimeFormat(LAP.nyelv, {
  hour: '2-digit', minute: '2-digit', timeZone: LAP.idozona,
});
const NAPNEV = new Intl.DateTimeFormat(LAP.nyelv, {
  weekday: 'short', timeZone: LAP.idozona,
});

export function datumHosszu(iso) { return HOSSZU.format(datum(iso)); }
export function datumRovid(iso) { return ROVID.format(datum(iso)); }
export function ora(iso) { return ORA.format(datum(iso)); }
export function napNev(iso) { return NAPNEV.format(datum(iso)).replace(/\.$/, ''); }

/** "ma", "tegnap", "3 napja", azon túl rövid dátum. */
export function relativDatum(iso, most = new Date()) {
  const nap = napKulonbseg(datum(iso), most);
  if (nap <= 0) return 'ma';
  if (nap === 1) return 'tegnap';
  if (nap < 7) return `${nap} napja`;
  return datumRovid(iso);
}

/** Hány naptári nap telt el a cikk dátuma óta (helyi idő szerint). */
export function napKulonbseg(mikor, most = new Date()) {
  const a = Date.UTC(mikor.getFullYear(), mikor.getMonth(), mikor.getDate());
  const b = Date.UTC(most.getFullYear(), most.getMonth(), most.getDate());
  return Math.round((b - a) / 86400000);
}

export function datum(iso) {
  // A puszta "2026-08-09" alakot a JS UTC-ként értené; délre toljuk, hogy a
  // budapesti nap ne csússzon el egy nappal.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Érvénytelen dátum: ${iso}`);
  return d;
}

export function fok(ertek) {
  return `${Math.round(ertek)}°`;
}

export function csapadek(mm) {
  if (mm == null) return '–';
  if (mm < 0.05) return '0 mm';
  return `${mm.toFixed(1).replace('.', ',')} mm`;
}

export function tavolsag(km) {
  return `${km.toFixed(1).replace('.', ',')} km`;
}
