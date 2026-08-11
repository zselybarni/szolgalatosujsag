/**
 * A szerkesztő összeszerelése: adatok betöltése, űrlap, előnézet, kimenet.
 *
 * A lap nem tud fájlt írni a repóba – nincs mögötte kiszolgáló –, ezért a
 * végeredmény letölthető, vágólapra másolható, illetve egy előre kitöltött
 * GitHub-űrlapon beküldhető.
 */

import { LAP, REPO, UTVONALAK } from '../config.js';
import { jegyzekBetolt } from '../content.js';
import { elem, urit } from '../dom.js';
import { datumHosszu, ora } from '../format.js';
import { temaInditas } from '../theme.js';
import { allapotLetrehoz, maiNap, uresPiszkozat } from './allapot.js';
import { ellenoriz, vanHiba } from './ellenorzes.js';
import { elonezetEpit } from './elonezet.js';
import { fajlUtvonal, markdownOsszeallit } from './kimenet.js';
import { urlapEpit } from './urlap.js';

const GITHUB_URL_KORLAT = 6000;

temaInditas();

const allapot = allapotLetrehoz();
const urlapTarolo = document.getElementById('urlap');
const elonezetTarolo = document.getElementById('elonezet');
const uzenetTarolo = document.getElementById('uzenetek');
const cikkValaszto = document.getElementById('cikk-valaszto');

document.getElementById('lap-neve').textContent = LAP.nev;

const { mindenCikk, kepek, kuratltRovatok } = await adatokBetolt();

/**
 * A behúzott, de még fel nem töltött képek: útvonal → a helyi fájl ideiglenes
 * címe. Csak az előnézethez kell; a lapra a fájl feltöltésével kerül fel.
 */
const helyiKepek = new Map();

const urlap = urlapEpit(urlapTarolo, allapot, {
  rovatok: rovatokListaja(mindenCikk, kuratltRovatok),
  cimkek: cimkekListaja(mindenCikk),
  szerzok: [...new Set(mindenCikk.map((c) => c.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'hu')),
  kepek: kepek.map((k) => k.path),
  kuratltRovatok,
  helyiKepRogzit: (utvonal, fajl) => {
    const regi = helyiKepek.get(utvonal);
    if (regi) URL.revokeObjectURL(regi);
    helyiKepek.set(utvonal, URL.createObjectURL(fajl));
  },
});

const elonezet = elonezetEpit(elonezetTarolo, {
  markdownForras: () => markdownOsszeallit(allapot.get()),
  mindenCikk,
  helyiKepek,
});

allapot.figyel((piszkozat) => {
  urlap.frissit(piszkozat);
  elonezet.frissit(piszkozat);
  uzenetekRajzol(piszkozat);
});

cikkValasztoFeltolt();
kimenetKot();
piszkozatVisszatoltes();

allapot.frissit({});

/* ------------------------------------------------------------------------ */

async function adatokBetolt() {
  const [jegyzek, kepJegyzek, rovatJegyzek] = await Promise.all([
    jegyzekBetolt().catch(() => ({ mindenCikk: [] })),
    keres(UTVONALAK.kepekJson, { kepek: [] }),
    keres(UTVONALAK.rovatokJson, { rovatok: [] }),
  ]);

  return {
    mindenCikk: jegyzek.mindenCikk ?? jegyzek.cikkek ?? [],
    kepek: kepJegyzek.kepek ?? [],
    kuratltRovatok: rovatJegyzek.rovatok ?? [],
  };
}

async function keres(utvonal, tartalek) {
  try {
    const valasz = await fetch(utvonal, { headers: { Accept: 'application/json' } });
    return valasz.ok ? await valasz.json() : tartalek;
  } catch {
    return tartalek;
  }
}

function rovatokListaja(cikkek, kuratltak) {
  const keszlet = new Set([...kuratltak, ...cikkek.map((c) => c.section).filter(Boolean)]);
  return [...keszlet].sort((a, b) => a.localeCompare(b, 'hu'));
}

function cimkekListaja(cikkek) {
  const szamlalo = new Map();
  for (const cimke of cikkek.flatMap((c) => c.tags ?? [])) {
    szamlalo.set(cimke, (szamlalo.get(cimke) ?? 0) + 1);
  }
  return [...szamlalo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hu'))
    .map(([cimke]) => cimke);
}

/* --- meglévő cikk betöltése --------------------------------------------- */

function cikkValasztoFeltolt() {
  cikkValaszto.append(
    elem('option', { value: '', szoveg: '— Új cikk —' }),
    ...mindenCikk.map((cikk) => elem('option', {
      value: cikk.slug,
      szoveg: `${cikk.date} · ${cikk.title}`,
    })),
  );

  cikkValaszto.addEventListener('change', async () => {
    const slug = cikkValaszto.value;
    if (!slug) { allapot.csere(uresPiszkozat()); return; }
    const cikk = mindenCikk.find((c) => c.slug === slug);
    if (!cikk) return;

    const torzs = await cikkTorzsBetolt(cikk.path);
    allapot.csere({
      ...cikk,
      lead: cikk.lead ?? '',
      author: cikk.author ?? '',
      section: cikk.section ?? '',
      cover: cikk.cover ?? '',
      coverAlt: cikk.coverAlt ?? '',
      tags: cikk.tags ?? [],
      slugKezi: true,
      eredetiSlug: cikk.slug,
      torzs,
    });
  });
}

async function cikkTorzsBetolt(utvonal) {
  try {
    const valasz = await fetch(`./${utvonal}`);
    if (!valasz.ok) return '';
    const nyers = await valasz.text();
    const { frontmatterBont } = await import('../frontmatter.js');
    return frontmatterBont(nyers).torzs;
  } catch {
    return '';
  }
}

/* --- ellenőrzés --------------------------------------------------------- */

function uzenetekRajzol(piszkozat) {
  const uzenetek = ellenoriz(piszkozat, {
    cikkek: mindenCikk,
    kepek: kepek.map((k) => k.path),
    helyiKepek: [...helyiKepek.keys()],
  });

  urit(uzenetTarolo);
  if (!uzenetek.length) {
    uzenetTarolo.append(elem('p', { osztaly: 'szerk-uzenet szerk-uzenet--rendben', szoveg: '✓ Minden rendben, a cikk beküldhető.' }));
  } else {
    uzenetTarolo.append(elem('ul', { osztaly: 'szerk-uzenetlista' }, uzenetek.map((uzenet) => elem('li', {
      osztaly: `szerk-uzenet szerk-uzenet--${uzenet.szint}`,
      szoveg: uzenet.szoveg,
    }))));
  }

  const tiltva = vanHiba(uzenetek);
  for (const gomb of document.querySelectorAll('[data-kimenet]')) gomb.disabled = tiltva;
  document.getElementById('fajl-nev').textContent = piszkozat.slug ? fajlUtvonal(piszkozat) : '—';
}

/* --- kimenet ------------------------------------------------------------ */

function kimenetKot() {
  document.getElementById('letoltes').addEventListener('click', () => {
    const piszkozat = allapot.get();
    const blob = new Blob([markdownOsszeallit(piszkozat)], { type: 'text/markdown;charset=utf-8' });
    const cim = URL.createObjectURL(blob);
    const hivatkozas = elem('a', { href: cim, download: `${piszkozat.slug}.md` });
    hivatkozas.click();
    URL.revokeObjectURL(cim);
    visszajelzes('Letöltve. Tedd a content/cikkek mappába, majd futtasd az npm run index parancsot.');
  });

  document.getElementById('vagolap').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markdownOsszeallit(allapot.get()));
      visszajelzes('A fájl tartalma a vágólapon.');
    } catch {
      visszajelzes('A vágólap nem elérhető – használd a letöltést.', true);
    }
  });

  document.getElementById('github').addEventListener('click', () => {
    const piszkozat = allapot.get();
    const tartalom = markdownOsszeallit(piszkozat);
    const utvonal = fajlUtvonal(piszkozat);

    // Meglévő fájlt a GitHub nem tud előre kitöltve megnyitni, csak szerkesztésre.
    if (piszkozat.eredetiSlug === piszkozat.slug) {
      window.open(`https://github.com/${REPO.tulajdonos}/${REPO.nev}/edit/${REPO.ag}/${utvonal}`, '_blank', 'noopener');
      visszajelzes('A GitHub szerkesztője megnyílt. A tartalmat a Vágólap gombbal illesztheted be.');
      return;
    }

    const cim = `https://github.com/${REPO.tulajdonos}/${REPO.nev}/new/${REPO.ag}`
      + `?filename=${encodeURIComponent(utvonal)}&value=${encodeURIComponent(tartalom)}`;

    if (cim.length > GITHUB_URL_KORLAT) {
      visszajelzes('A cikk túl hosszú ahhoz, hogy a címben elférjen – másold vágólapra, és úgy illeszd be.', true);
      return;
    }
    window.open(cim, '_blank', 'noopener');
  });

  document.getElementById('uj').addEventListener('click', () => {
    if (!window.confirm('Biztosan új cikket kezdesz? A mostani piszkozat elveszik.')) return;
    cikkValaszto.value = '';
    allapot.mentettTorol();
    allapot.csere(uresPiszkozat());
  });
}

function visszajelzes(szoveg, baj = false) {
  const sav = document.getElementById('visszajelzes');
  sav.textContent = szoveg;
  sav.classList.toggle('szerk-visszajelzes--baj', baj);
  sav.hidden = false;
  clearTimeout(visszajelzes.idozito);
  visszajelzes.idozito = setTimeout(() => { sav.hidden = true; }, 7000);
}

/* --- piszkozat visszatöltése -------------------------------------------- */

function piszkozatVisszatoltes() {
  const mentett = allapot.mentettBetolt();
  if (!mentett) return;

  const { piszkozat, mentve } = mentett;
  const sav = document.getElementById('piszkozat-sav');
  sav.hidden = false;
  urit(sav).append(
    elem('span', {
      szoveg: `Félbehagyott piszkozat: „${piszkozat.title || 'cím nélkül'}"`
        + `${mentve ? ` – ${datumHosszu(new Date(mentve).toISOString())} ${ora(new Date(mentve).toISOString())}` : ''}.`,
    }),
    elem('button', {
      type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk', szoveg: 'Folytatom',
      onclick: () => { allapot.csere(piszkozat); sav.hidden = true; },
    }),
    elem('button', {
      type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk', szoveg: 'Eldobom',
      onclick: () => { allapot.mentettTorol(); sav.hidden = true; },
    }),
  );
}

// A dátum alapértéke a mai nap, hogy ne kelljen beírni.
if (!allapot.get().date) allapot.frissit({ date: maiNap() });
