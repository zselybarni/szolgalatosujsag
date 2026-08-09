/**
 * Időjárás-adatok az Open-Meteo ingyenes API-járól.
 *
 * A tábor és mind a nyolc állomás **egyetlen** kérésben szerepel: az API a
 * vesszővel felsorolt koordinátákra tömböt ad vissza, a kérés sorrendjében.
 * A válasz localStorage-ba kerül; hálózati hiba esetén a lejárt mentés is
 * felhasználható (legfeljebb IDOJARAS.legfeljebbRegiOra koráig), csak jelezzük.
 */

import { ALLOMASOK, IDOJARAS, LAP, TABOR } from './config.js';

const HELYEK = [TABOR, ...ALLOMASOK];

/**
 * @typedef {{ nev: string, jelenlegi: object, napok: object[] }} HelyIdojaras
 * @typedef {{ tabor: HelyIdojaras, allomasok: HelyIdojaras[], lekerdezve: string, elavult: boolean }} Idojaras
 */

let futoKeres = null;

/** @returns {Promise<Idojaras>} */
export function idojarasBetolt({ eroltetett = false } = {}) {
  if (!eroltetett) {
    const mentett = cacheOlvas();
    if (mentett && !lejart(mentett, IDOJARAS.cacheMasodperc)) {
      return Promise.resolve({ ...mentett.adat, elavult: false });
    }
  }
  if (futoKeres) return futoKeres;

  futoKeres = lekerdez()
    .then((adat) => {
      cacheIr(adat);
      return { ...adat, elavult: false };
    })
    .catch((hiba) => {
      const mentett = cacheOlvas();
      if (mentett && !lejart(mentett, IDOJARAS.legfeljebbRegiOra * 3600)) {
        return { ...mentett.adat, elavult: true };
      }
      throw hiba;
    })
    .finally(() => { futoKeres = null; });

  return futoKeres;
}

async function lekerdez() {
  const cim = new URL(IDOJARAS.vegpont);
  cim.search = new URLSearchParams({
    latitude: HELYEK.map((h) => h.lat).join(','),
    longitude: HELYEK.map((h) => h.lon).join(','),
    current: 'temperature_2m,cloud_cover,precipitation,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    timezone: LAP.idozona,
    forecast_days: String(IDOJARAS.napok),
  }).toString();

  const valasz = await fetch(cim, { headers: { Accept: 'application/json' } });
  if (!valasz.ok) throw new Error(`Open-Meteo válasz: ${valasz.status}`);

  const nyers = await valasz.json();
  // Egy koordinátánál objektum, többnél tömb jön vissza – mindkettőt kezeljük.
  const lista = Array.isArray(nyers) ? nyers : [nyers];
  if (lista.length !== HELYEK.length) {
    throw new Error(`Az API ${lista.length} helyet adott vissza ${HELYEK.length} helyett.`);
  }

  const helyek = lista.map((tetel, i) => alakit(HELYEK[i], tetel));
  return {
    tabor: helyek[0],
    allomasok: helyek.slice(1).map((hely, i) => ({ ...hely, tav: ALLOMASOK[i].tav })),
    lekerdezve: new Date().toISOString(),
  };
}

function alakit(hely, tetel) {
  const most = tetel.current ?? {};
  const napi = tetel.daily ?? { time: [] };

  return {
    nev: hely.nev,
    rovidNev: hely.rovidNev ?? hely.nev,
    magassag: tetel.elevation,
    jelenlegi: {
      ido: most.time,
      homerseklet: most.temperature_2m,
      felhozet: most.cloud_cover,
      csapadek: most.precipitation,
      weatherCode: most.weather_code,
      isDay: most.is_day === 1,
    },
    napok: napi.time.map((nap, i) => ({
      nap,
      max: napi.temperature_2m_max?.[i],
      min: napi.temperature_2m_min?.[i],
      csapadek: napi.precipitation_sum?.[i],
      weatherCode: napi.weather_code?.[i],
    })),
  };
}

function cacheOlvas() {
  try {
    const nyers = localStorage.getItem(IDOJARAS.cacheKulcs);
    if (!nyers) return null;
    const mentett = JSON.parse(nyers);
    return mentett?.adat?.tabor ? mentett : null;
  } catch {
    return null;
  }
}

function cacheIr(adat) {
  try {
    localStorage.setItem(IDOJARAS.cacheKulcs, JSON.stringify({ mentve: Date.now(), adat }));
  } catch { /* tele a tár vagy privát mód – a lap enélkül is működik */ }
}

function lejart(mentett, masodperc) {
  return Date.now() - mentett.mentve > masodperc * 1000;
}
