/**
 * Az Open-Meteo WMO kódjainak magyar leírása, és az ikonválasztás szabálya.
 *
 * A feladat kikötése szerint a felhőzöttséget ikon jelzi, ezért derült időben
 * a borítottság százaléka dönt (nap → napos-felhős → felhős → borult), és csak
 * csapadékos kódnál veszi át a WMO-kód az irányítást.
 */

const LEIRAS = new Map([
  [0, 'Derült'], [1, 'Túlnyomóan derült'], [2, 'Gomolyfelhős'], [3, 'Borult'],
  [45, 'Ködös'], [48, 'Zúzmarás köd'],
  [51, 'Gyenge szitálás'], [53, 'Szitálás'], [55, 'Erős szitálás'],
  [56, 'Ónos szitálás'], [57, 'Erős ónos szitálás'],
  [61, 'Gyenge eső'], [63, 'Eső'], [65, 'Erős eső'],
  [66, 'Ónos eső'], [67, 'Erős ónos eső'],
  [71, 'Gyenge havazás'], [73, 'Havazás'], [75, 'Erős havazás'], [77, 'Hószemcsék'],
  [80, 'Záporok'], [81, 'Erős záporok'], [82, 'Felhőszakadás'],
  [85, 'Hózáporok'], [86, 'Erős hózáporok'],
  [95, 'Zivatar'], [96, 'Jégesős zivatar'], [99, 'Erős jégesős zivatar'],
]);

export function leiras(kod) {
  return LEIRAS.get(kod) ?? 'Ismeretlen';
}

/**
 * @param {{ weatherCode: number, cloudCover: number, isDay: boolean }} allapot
 * @returns {string} ikonazonosító a lapba ágyazott készletből
 */
export function ikonAzonosito({ weatherCode, cloudCover, isDay }) {
  const kod = weatherCode ?? 0;

  if (kod >= 95) return 'ikon-zivatar';
  if (kod >= 85 || (kod >= 71 && kod <= 77)) return 'ikon-ho';
  if (kod >= 80) return 'ikon-zapor';
  if (kod >= 61) return 'ikon-eso';
  if (kod >= 51) return 'ikon-szitalas';
  if (kod === 45 || kod === 48) return 'ikon-kod';

  // Csapadékmentes idő: a felhőborítottság dönt.
  const boritas = cloudCover ?? 0;
  if (boritas < 15) return isDay ? 'ikon-nap' : 'ikon-hold';
  if (boritas < 60) return isDay ? 'ikon-nap-felho' : 'ikon-hold-felho';
  if (boritas < 88) return 'ikon-felho';
  return 'ikon-borult';
}

/** Rövid, emberi felhőzet-leírás a képernyőolvasóknak és a segédszövegnek. */
export function felhozetSzoveg(boritas) {
  if (boritas == null) return 'ismeretlen felhőzet';
  if (boritas < 15) return 'derült';
  if (boritas < 60) return 'gyengén felhős';
  if (boritas < 88) return 'erősen felhős';
  return 'borult';
}
