/**
 * Közzététel egyenesen a GitHubra, a Contents API-n.
 *
 * Ez a szerkesztő *választható* útja: alapesetben a fájl letöltése és kézi
 * beküldése a javasolt mód, mert az semmilyen jogosultságot nem kér. Aki
 * viszont egy kattintással szeretne közzétenni – a képekkel együtt –, annak
 * kell egy írási jogú token.
 *
 * A token kezelésének szabályai, szándékosan szigorúan:
 *   – soha nem kerül a piszkozatba, tehát a mentésbe sem;
 *   – alapesetben csak a memóriában él, újratöltéskor elveszik;
 *   – ha az olvasó kéri, `sessionStorage`-ba megy, ami a lap bezárásával
 *     törlődik – `localStorage`-ba szándékosan nem, mert az ott maradna;
 *   – kizárólag `Authorization` fejlécben utazik, címben soha.
 */

const TOKEN_KULCS = 'hirfolyam:gh-token';
const API = 'https://api.github.com';

/* --- a token tárolása ---------------------------------------------------- */

let memoriaToken = '';

export const tokenTarolo = {
  olvas() {
    return memoriaToken || sessionOlvas();
  },

  /** @param {{ megjegyez?: boolean }} beallitas a lap bezárásáig emlékezzen-e */
  ir(token, { megjegyez = false } = {}) {
    memoriaToken = token ?? '';
    if (megjegyez && memoriaToken) sessionIr(memoriaToken);
    else sessionTorol();
  },

  torol() {
    memoriaToken = '';
    sessionTorol();
  },

  megjegyzett() {
    return Boolean(sessionOlvas());
  },
};

function sessionOlvas() {
  try { return sessionStorage.getItem(TOKEN_KULCS) ?? ''; } catch { return ''; }
}
function sessionIr(token) {
  try { sessionStorage.setItem(TOKEN_KULCS, token); } catch { /* privát mód */ }
}
function sessionTorol() {
  try { sessionStorage.removeItem(TOKEN_KULCS); } catch { /* privát mód */ }
}

/* --- kliens -------------------------------------------------------------- */

/**
 * @param {{ token: string, repo: { tulajdonos: string, nev: string, ag: string },
 *           kerdez?: typeof fetch }} beallitas
 *   A `kerdez` cserélhető, hogy a kliens hálózat nélkül tesztelhető legyen.
 */
export function githubKliens({ token, repo, kerdez = (...ervek) => fetch(...ervek) }) {
  const alap = `${API}/repos/${repo.tulajdonos}/${repo.nev}`;

  return { repoEllenoriz, fajlKiir, fajlTorol };

  /** Van-e egyáltalán elérés és írási jog. */
  async function repoEllenoriz() {
    const valasz = await kerdez(alap, { headers: fejlec() });
    if (!valasz.ok) throw hibabol(valasz, await torzsSzoveg(valasz));

    const adat = await valasz.json();
    return {
      nev: adat.full_name,
      irhat: adat.permissions?.push !== false,
      ag: repo.ag,
    };
  }

  /**
   * Fájl létrehozása vagy felülírása. Ha a fájl már létezik, a GitHub megkéri
   * a mostani változat `sha`-ját – ez védi meg attól, hogy vakon felülírjuk
   * valaki más közben beküldött módosítását.
   *
   * @returns {Promise<{ uj: boolean, commitCim: string|null }>}
   */
  async function fajlKiir({ utvonal, base64, uzenet }) {
    const cim = `${alap}/contents/${utvonal.split('/').map(encodeURIComponent).join('/')}`;
    const sha = await meglevoSha(cim);

    const valasz = await kerdez(cim, {
      method: 'PUT',
      headers: { ...fejlec(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: uzenet,
        content: base64,
        branch: repo.ag,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!valasz.ok) throw hibabol(valasz, await torzsSzoveg(valasz));

    const adat = await valasz.json();
    return { uj: !sha, commitCim: adat.commit?.html_url ?? null };
  }

  /**
   * Fájl törlése a repóból. A GitHub ehhez is a mostani `sha`-t kéri, tehát a
   * törlés ugyanúgy ütközik, ha közben más módosította a fájlt – vakon nem
   * törlünk el semmit.
   *
   * @returns {Promise<{ commitCim: string|null }>}
   */
  async function fajlTorol({ utvonal, uzenet }) {
    const cim = `${alap}/contents/${utvonal.split('/').map(encodeURIComponent).join('/')}`;
    const sha = await meglevoSha(cim);
    if (!sha) throw new Error('Ez a fájl már nincs a repóban – nincs mit törölni.');

    const valasz = await kerdez(cim, {
      method: 'DELETE',
      headers: { ...fejlec(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: uzenet, sha, branch: repo.ag }),
    });

    if (!valasz.ok) throw hibabol(valasz, await torzsSzoveg(valasz));

    const adat = await valasz.json();
    return { commitCim: adat.commit?.html_url ?? null };
  }

  async function meglevoSha(cim) {
    const valasz = await kerdez(`${cim}?ref=${encodeURIComponent(repo.ag)}`, { headers: fejlec() });
    if (valasz.status === 404) return null;
    if (!valasz.ok) throw hibabol(valasz, await torzsSzoveg(valasz));

    const adat = await valasz.json();
    if (Array.isArray(adat)) throw new Error('A megadott útvonal egy mappa, nem fájl.');
    return adat.sha ?? null;
  }

  function fejlec() {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }
}

/** A HTTP-hibákat emberi mondatra fordítjuk – a nyers kód nem segít senkinek. */
export function hibabol(valasz, torzs = '') {
  const reszlet = torzs ? ` (${torzs})` : '';
  if (valasz.status === 401) return new Error('A token érvénytelen vagy lejárt.');
  if (valasz.status === 403) return new Error(`A token nem kapott írási jogot ehhez a repóhoz.${reszlet}`);
  if (valasz.status === 404) return new Error('A repó nem található ezzel a tokennel – ellenőrizd a nevet és a token hozzáférését.');
  if (valasz.status === 409) return new Error('A fájl közben megváltozott a repóban. Töltsd be újra, és küldd be ismét.');
  if (valasz.status === 422) return new Error(`A GitHub elutasította a beküldést.${reszlet}`);
  return new Error(`GitHub hiba: ${valasz.status}${reszlet}`);
}

async function torzsSzoveg(valasz) {
  try {
    const adat = await valasz.json();
    return adat?.message ?? '';
  } catch {
    return '';
  }
}

/* --- base64 -------------------------------------------------------------- */

/** UTF-8 szöveg → base64. A GitHub API csak így fogadja a tartalmat. */
export function base64Szoveg(szoveg) {
  return base64Bajtok(new TextEncoder().encode(szoveg));
}

export function base64Bajtok(bajtok) {
  const CSOMAG = 0x8000; // nagy fájlnál a String.fromCharCode elfogyna
  let nyers = '';
  for (let i = 0; i < bajtok.length; i += CSOMAG) {
    nyers += String.fromCharCode(...bajtok.subarray(i, i + CSOMAG));
  }
  return btoa(nyers);
}

export async function base64Fajl(fajl) {
  return base64Bajtok(new Uint8Array(await fajl.arrayBuffer()));
}
