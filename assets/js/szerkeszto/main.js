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
import { base64Fajl, base64Szoveg, githubKliens, tokenTarolo } from './github.js';
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
    if (regi) URL.revokeObjectURL(regi.url);
    helyiKepek.set(utvonal, { url: URL.createObjectURL(fajl), fajl });
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
  torlesGombFrissit(piszkozat);
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

  torlesKot();
  kozzetetelKot();

  document.getElementById('uj').addEventListener('click', () => {
    if (!window.confirm('Biztosan új cikket kezdesz? A mostani piszkozat elveszik.')) return;
    cikkValaszto.value = '';
    allapot.mentettTorol();
    allapot.csere(uresPiszkozat());
  });
}

/* --- meglévő cikk törlése ------------------------------------------------ */

/**
 * Törölni csak azt lehet, ami a repóban már fent van: a legördülő listából
 * betöltött cikket. A még be nem küldött piszkozatnak nincs mit törölni – azt
 * az „Új cikk" gomb dobja el.
 *
 * A gomb szándékosan nem `data-kimenet`: egy hibás fejlécű cikket is ki kell
 * tudni venni a repóból, épp azért, mert hibás.
 */
function torlesGombFrissit(piszkozat) {
  const gomb = document.getElementById('torles');
  gomb.disabled = !piszkozat.eredetiSlug;
  gomb.title = piszkozat.eredetiSlug
    ? `${fajlUtvonal({ slug: piszkozat.eredetiSlug })} törlése a repóból`
    : 'Csak a legördülő listából betöltött, már megjelent cikk törölhető';
}

function torlesKot() {
  const gomb = document.getElementById('torles');

  gomb.addEventListener('click', async () => {
    const piszkozat = allapot.get();
    // A fájl a *betöltött* néven van fent: ha közben átírták a címet, a
    // piszkozat slugja már másra mutatna.
    const slug = piszkozat.eredetiSlug;
    if (!slug) return;

    const utvonal = fajlUtvonal({ slug });
    const token = tokenTarolo.olvas();

    // Token nélkül a GitHub saját törlőlapja kérdez rá, ugyanúgy, ahogy a
    // beküldést is ott hagyja jóvá az ember.
    if (!token) {
      window.open(`https://github.com/${REPO.tulajdonos}/${REPO.nev}/delete/${REPO.ag}/${utvonal}`, '_blank', 'noopener');
      visszajelzes('A GitHub törlőlapja megnyílt – ott erősítsd meg a törlést.');
      return;
    }

    const kerdes = `Biztosan törlöd a repóból ezt a cikket?\n\n${utvonal}\n\n`
      + 'A törlés azonnal commitba kerül, a szerkesztőben lévő piszkozat pedig elveszik.';
    if (!window.confirm(kerdes)) return;

    const naplo = document.getElementById('kozzetetel-naplo');
    // A napló a tokenes szakaszban él: ha csukva van, a visszajelzés elveszne.
    document.getElementById('kozzetetel').open = true;
    gomb.disabled = true;
    urit(naplo);

    try {
      const eredmeny = await githubKliens({ token, repo: REPO }).fajlTorol({
        utvonal,
        uzenet: `Cikk törlése: ${piszkozat.title || slug}`,
      });

      naplot(naplo, `Törölve: ${utvonal}`, 'rendben');
      commitHivatkozas(naplo, eredmeny.commitCim);
      naplot(naplo, 'A lap a közzétételi folyamat lefutása után frissül (néhány perc).', 'info');

      cikkListabolTorol(slug);
      allapot.mentettTorol();
      allapot.csere(uresPiszkozat());
    } catch (hiba) {
      naplot(naplo, hiba.message, 'hiba');
    } finally {
      torlesGombFrissit(allapot.get());
    }
  });
}

/** A törölt cikk a legördülő listából és az ellenőrzés alapjából is kikerül. */
function cikkListabolTorol(slug) {
  const helye = mindenCikk.findIndex((cikk) => cikk.slug === slug);
  if (helye >= 0) mindenCikk.splice(helye, 1);
  [...cikkValaszto.options].find((lehetoseg) => lehetoseg.value === slug)?.remove();
  cikkValaszto.value = '';
}

/* --- közzététel tokennel ------------------------------------------------- */

function kozzetetelKot() {
  const tokenMezo = document.getElementById('token');
  const megjegyezMezo = document.getElementById('token-megjegyez');
  const naplo = document.getElementById('kozzetetel-naplo');

  // Ha a munkamenetben már megadták, ne kelljen újra beírni.
  if (tokenTarolo.megjegyzett()) {
    tokenMezo.value = tokenTarolo.olvas();
    megjegyezMezo.checked = true;
  }

  const tokenBe = () => {
    tokenTarolo.ir(tokenMezo.value.trim(), { megjegyez: megjegyezMezo.checked });
    return tokenTarolo.olvas();
  };

  tokenMezo.addEventListener('input', tokenBe);
  megjegyezMezo.addEventListener('change', tokenBe);

  document.getElementById('token-torol').addEventListener('click', () => {
    tokenTarolo.torol();
    tokenMezo.value = '';
    megjegyezMezo.checked = false;
    naplot(naplo, 'A token törölve.', 'info');
  });

  document.getElementById('token-ellenoriz').addEventListener('click', async () => {
    const token = tokenBe();
    if (!token) { naplot(naplo, 'Előbb írd be a tokent.', 'hiba'); return; }
    try {
      const adat = await githubKliens({ token, repo: REPO }).repoEllenoriz();
      naplot(
        naplo,
        adat.irhat
          ? `Rendben: ${adat.nev}, ág: ${adat.ag}. A token írhat.`
          : `Elérés megvan (${adat.nev}), de a token nem kapott írási jogot.`,
        adat.irhat ? 'rendben' : 'hiba',
      );
    } catch (hiba) {
      naplot(naplo, hiba.message, 'hiba');
    }
  });

  document.getElementById('kozzetesz').addEventListener('click', async () => {
    const token = tokenBe();
    if (!token) { naplot(naplo, 'Előbb írd be a tokent.', 'hiba'); return; }

    const piszkozat = allapot.get();
    const gomb = document.getElementById('kozzetesz');
    gomb.disabled = true;
    urit(naplo);

    try {
      const kliens = githubKliens({ token, repo: REPO });
      await kliens.repoEllenoriz();

      // Először a képek: ha a cikk hivatkozik rájuk, legyenek már a helyükön.
      for (const [utvonal, { fajl }] of [...helyiKepek]) {
        naplot(naplo, `Kép feltöltése: ${utvonal}…`, 'info');
        await kliens.fajlKiir({
          utvonal,
          base64: await base64Fajl(fajl),
          uzenet: `Kép: ${utvonal.split('/').pop()}`,
        });
        helyiKepek.delete(utvonal);
        kepek.push({ path: utvonal, nev: utvonal.split('/').pop() });
      }

      const utvonal = fajlUtvonal(piszkozat);
      const eredmeny = await kliens.fajlKiir({
        utvonal,
        base64: base64Szoveg(markdownOsszeallit(piszkozat)),
        uzenet: `${piszkozat.eredetiSlug === piszkozat.slug ? 'Cikk módosítása' : 'Új cikk'}: ${piszkozat.title}`,
      });

      naplot(naplo, `${eredmeny.uj ? 'Beküldve' : 'Módosítva'}: ${utvonal}`, 'rendben');
      commitHivatkozas(naplo, eredmeny.commitCim);
      naplot(naplo, 'A lap a közzétételi folyamat lefutása után frissül (néhány perc).', 'info');

      allapot.mentettTorol();
      allapot.frissit({ eredetiSlug: piszkozat.slug });
    } catch (hiba) {
      naplot(naplo, hiba.message, 'hiba');
    } finally {
      gomb.disabled = false;
      uzenetekRajzol(allapot.get());
    }
  });
}

function commitHivatkozas(tarolo, cim) {
  if (!cim) return;
  tarolo.append(elem('p', { osztaly: 'szerk-uzenet szerk-uzenet--info' }, [
    elem('a', { href: cim, target: '_blank', rel: 'noopener', szoveg: 'A commit megnyitása a GitHubon' }),
  ]));
}

function naplot(tarolo, szoveg, szint) {
  tarolo.append(elem('p', { osztaly: `szerk-uzenet szerk-uzenet--${szint}`, szoveg }));
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
