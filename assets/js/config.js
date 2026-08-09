/**
 * A lap egyetlen konfigurációs pontja. Átnevezéshez, új állomás felvételéhez
 * vagy a hírsáv szabályainak módosításához elég ezt a fájlt szerkeszteni.
 */

/**
 * A lap neve és feliratai. Ez az egyetlen hely, ahol át kell írni őket:
 * a lapfej, a lábléc, a böngészőfül címe és a lap leírása innen dolgozik.
 */
export const LAP = {
  nev: '9. Szolgálatos Újság',
  /** A lapfejben, a név alatt futó felirat. */
  alcim: 'Online lapja',
  /** A lábléc első sorában a név után álló szöveg. */
  lablec: 'Online lapja',
  /** A keresőknek és a linkmegosztásnak szóló leírás. */
  leiras: 'A 9. Szolgálatos Csoport hírei, riportjai.',
  nyelv: 'hu-HU',
  idozona: 'Europe/Budapest',
};

export const HIRSAV = {
  /** Ennyi napra visszamenőleg számít "friss"-nek egy cikk. */
  napok: 5,
  /** A szalag legfeljebb ennyi címet forgat, hogy követhető maradjon. */
  maxTetel: 10,
  /** Ha az 5 napos ablak üres, ennyi legfrissebb cikk kerül a szalagra. */
  tartalekTetel: 5,
};

export const HIRFOLYAM = {
  /** Az első betöltéskor látható cikkek száma a vezető cikk után. */
  elsoAdag: 9,
  /** A "Továbbiak" gomb ennyivel bővíti a listát. */
  tovabbiAdag: 9,
  /**
   * A `featured` jelölés ennyi napig emeli a cikket a hírfolyam élére.
   * Utána a jelölés magától elévül, és újra a legfrissebb cikk vezet.
   */
  kiemelesNapok: 14,
};

export const LEAD = {
  /** Kézzel írt lead híján ennyi jelig vesszük át az első bekezdést. */
  maxHossz: 240,
  /** A cikk fejlécébe ilyen széles sorokban kerül vissza a lead. */
  sorSzelesseg: 76,
};

/**
 * A Gyermekvasutas Otthon és Tábor (Hűvösvölgy, Gyermekvasúthoz vezető út).
 * Koordináta: OpenStreetMap / Nominatim.
 */
export const TABOR = {
  nev: 'Gyermekvasutas Otthon és Tábor',
  rovidNev: 'Tábor',
  lat: 47.5426,
  lon: 18.9629,
};

/**
 * A Gyermekvasút jelenleg üzemelő állomásai és megállói, a vonal sorrendjében
 * Széchenyihegytől Hűvösvölgyig. Koordináták: OpenStreetMap.
 * A megszűnt megállók (Vadaspark, Kis-Hárs-hegy) szándékosan nem szerepelnek.
 */
export const ALLOMASOK = [
  { nev: 'Széchenyihegy', tav: 0.0,  lat: 47.49412, lon: 18.97670 },
  { nev: 'Normafa',       tav: 0.8,  lat: 47.49986, lon: 18.97077 },
  { nev: 'Csillebérc',    tav: 1.7,  lat: 47.49814, lon: 18.96169 },
  { nev: 'Virágvölgy',    tav: 3.0,  lat: 47.50584, lon: 18.95874 },
  { nev: 'Jánoshegy',     tav: 4.5,  lat: 47.51474, lon: 18.95086 },
  { nev: 'Szépjuhászné',  tav: 6.7,  lat: 47.52840, lon: 18.95522 },
  { nev: 'Hárshegy',      tav: 8.7,  lat: 47.53535, lon: 18.96135 },
  { nev: 'Hűvösvölgy',    tav: 11.2, lat: 47.54110, lon: 18.96366 },
];

export const IDOJARAS = {
  vegpont: 'https://api.open-meteo.com/v1/forecast',
  /** Ennyi ideig használjuk a localStorage-ba mentett választ új kérés nélkül. */
  cacheMasodperc: 15 * 60,
  /** Hálózati hiba esetén ennél régebbi mentést már nem mutatunk. */
  legfeljebbRegiOra: 12,
  cacheKulcs: 'hirfolyam:idojaras',
  napok: 3,
};

export const UTVONALAK = {
  indexJson: './content/index.json',
};
