/**
 * A szerkesztő állapota: a piszkozat, a rá figyelő függvények, és a
 * localStorage-ba mentés.
 *
 * Böngészőben szerkesztünk, ahol egy véletlen újratöltés minden munkát elvinne,
 * ezért a piszkozat minden változásnál mentődik, és induláskor visszatölthető.
 */

const KULCS = 'hirfolyam:szerkeszto-piszkozat';
const MENTES_KESLELTETES = 400;
/** Ennél régebbi piszkozatot már nem ajánlunk fel folytatásra. */
const MENTES_ERVENYES_NAP = 14;

export function uresPiszkozat(ma = new Date()) {
  return {
    title: '',
    date: maiNap(ma),
    section: '',
    author: '',
    lead: '',
    cover: '',
    coverAlt: '',
    featured: false,
    tags: [],
    slug: '',
    slugKezi: false,
    torzs: '',
    eredetiSlug: null,
  };
}

export function maiNap(mikor = new Date()) {
  const ketjegyu = (szam) => String(szam).padStart(2, '0');
  return `${mikor.getFullYear()}-${ketjegyu(mikor.getMonth() + 1)}-${ketjegyu(mikor.getDate())}`;
}

export function allapotLetrehoz() {
  let piszkozat = uresPiszkozat();
  /**
   * A legutóbb betöltött állapot: üres piszkozat, vagy egy meglévő cikk.
   * Amíg a piszkozat ezzel egyezik, nincs mit menteni – így egy cikk puszta
   * megnyitása nem hoz létre „félbehagyott piszkozatot".
   */
  let alap = JSON.stringify(piszkozat);
  const figyelok = new Set();
  let mentesIdozito = null;

  return {
    get() { return piszkozat; },

    /** Részleges módosítás; a figyelők utána újrarajzolnak. */
    frissit(reszlet, { csendben = false } = {}) {
      piszkozat = { ...piszkozat, ...reszlet };
      if (!csendben) ertesit();
      mentesUtemez();
    },

    /**
     * Teljes állapotcsere: új cikk kezdése, meglévő betöltése, vagy mentett
     * piszkozat folytatása. Az így betöltött állapot lesz az új alap.
     */
    csere(ujPiszkozat, { alapnakVesz = true } = {}) {
      piszkozat = { ...uresPiszkozat(), ...ujPiszkozat };
      if (alapnakVesz) alap = JSON.stringify(piszkozat);
      ertesit();
      mentesUtemez();
    },

    figyel(fuggveny) {
      figyelok.add(fuggveny);
      return () => figyelok.delete(fuggveny);
    },

    /**
     * @returns {{ piszkozat: object, mentve: number }|null} a mentett piszkozat,
     *   ha van benne érdemi tartalom, és nem túl régi
     */
    mentettBetolt() {
      try {
        const nyers = localStorage.getItem(KULCS);
        if (!nyers) return null;

        const tarolt = JSON.parse(nyers);
        // A korábbi változat magát a piszkozatot mentette, időbélyeg nélkül.
        const piszkozat = tarolt?.piszkozat ?? tarolt;
        const mentve = tarolt?.mentve ?? 0;

        if (!erdemiTartalom(piszkozat)) return null;
        if (mentve && Date.now() - mentve > MENTES_ERVENYES_NAP * 86400000) return null;
        return { piszkozat, mentve };
      } catch {
        return null;
      }
    },

    mentettTorol() {
      try { localStorage.removeItem(KULCS); } catch { /* privát mód */ }
    },
  };

  function ertesit() {
    for (const figyelo of figyelok) figyelo(piszkozat);
  }

  function mentesUtemez() {
    clearTimeout(mentesIdozito);
    // Az érintetlen, üres piszkozatot nem mentjük: különben a következő
    // megnyitáskor egy tartalom nélküli „félbehagyott" cikket ajánlanánk fel.
    if (!erdemiTartalom(piszkozat)) return;
    // Ha a piszkozat még pontosan az, amit betöltöttünk, nincs mit őrizni.
    if (JSON.stringify(piszkozat) === alap) return;

    mentesIdozito = setTimeout(() => {
      try {
        localStorage.setItem(KULCS, JSON.stringify({ mentve: Date.now(), piszkozat }));
      } catch { /* tele a tár */ }
    }, MENTES_KESLELTETES);
  }
}

/** Van-e a piszkozatban bármi, amit érdemes megőrizni. */
function erdemiTartalom(piszkozat) {
  return Boolean((piszkozat?.title ?? '').trim() || (piszkozat?.torzs ?? '').trim());
}
