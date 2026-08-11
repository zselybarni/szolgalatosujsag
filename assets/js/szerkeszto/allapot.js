/**
 * A szerkesztő állapota: a piszkozat, a rá figyelő függvények, és a
 * localStorage-ba mentés.
 *
 * Böngészőben szerkesztünk, ahol egy véletlen újratöltés minden munkát elvinne,
 * ezért a piszkozat minden változásnál mentődik, és induláskor visszatölthető.
 */

const KULCS = 'hirfolyam:szerkeszto-piszkozat';
const MENTES_KESLELTETES = 400;

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

    csere(ujPiszkozat) {
      piszkozat = { ...uresPiszkozat(), ...ujPiszkozat };
      ertesit();
      mentesUtemez();
    },

    figyel(fuggveny) {
      figyelok.add(fuggveny);
      return () => figyelok.delete(fuggveny);
    },

    /** @returns {object|null} a mentett piszkozat, ha van értékelhető tartalma */
    mentettBetolt() {
      try {
        const nyers = localStorage.getItem(KULCS);
        if (!nyers) return null;
        const mentett = JSON.parse(nyers);
        const vanTartalom = (mentett?.title ?? '').trim() || (mentett?.torzs ?? '').trim();
        return vanTartalom ? mentett : null;
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
    mentesIdozito = setTimeout(() => {
      try { localStorage.setItem(KULCS, JSON.stringify(piszkozat)); } catch { /* tele a tár */ }
    }, MENTES_KESLELTETES);
  }
}
