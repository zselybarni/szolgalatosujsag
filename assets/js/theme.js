/**
 * Világos / sötét mód. Alapértelmezésben a rendszer beállítását követi; ha az
 * olvasó vált, a döntése localStorage-ban marad, és onnantól az győz.
 * A kezdeti beállítást az index.html fejlécében lévő apró szkript végzi el,
 * hogy ne villanjon fel a rossz háttér.
 */

const KULCS = 'hirfolyam:tema';

export function temaInditas() {
  const gomb = document.getElementById('tema-valto');
  const rendszer = window.matchMedia('(prefers-color-scheme: dark)');

  frissitGomb(gomb, jelenlegi(rendszer));

  gomb?.addEventListener('click', () => {
    const uj = jelenlegi(rendszer) === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', uj);
    try { localStorage.setItem(KULCS, uj); } catch { /* privát mód */ }
    frissitGomb(gomb, uj);
  });

  // Amíg nincs kézi döntés, kövessük a rendszer váltásait.
  rendszer.addEventListener('change', () => {
    if (mentett()) return;
    frissitGomb(gomb, rendszer.matches ? 'dark' : 'light');
  });
}

function jelenlegi(rendszer) {
  const beallitott = document.documentElement.getAttribute('data-theme');
  if (beallitott === 'dark' || beallitott === 'light') return beallitott;
  return rendszer.matches ? 'dark' : 'light';
}

function mentett() {
  try { return localStorage.getItem(KULCS); } catch { return null; }
}

function frissitGomb(gomb, tema) {
  if (!gomb) return;
  const sotetre = tema !== 'dark';
  gomb.setAttribute('aria-label', sotetre ? 'Sötét mód bekapcsolása' : 'Világos mód bekapcsolása');
  gomb.setAttribute('aria-pressed', String(tema === 'dark'));
}
