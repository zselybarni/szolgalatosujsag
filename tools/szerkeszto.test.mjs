import { test } from 'node:test';
import assert from 'node:assert/strict';

import { frontmatterBont } from '../assets/js/frontmatter.js';
import { beagyazottKepek, kepUtvonalHiba } from '../assets/js/kepek.js';
import { ellenoriz, vanHiba } from '../assets/js/szerkeszto/ellenorzes.js';
import { markdownOsszeallit } from '../assets/js/szerkeszto/kimenet.js';
import { fajlnevBol, slugHelyes, slugositas } from '../assets/js/szerkeszto/slug.js';
import { blokkKeret } from '../assets/js/szerkeszto/urlap.js';

const MA = new Date('2026-08-14T12:00:00');

function piszkozat(reszlet = {}) {
  return {
    title: 'Új menetrend lép életbe',
    date: '2026-08-14',
    section: 'Vasút',
    author: 'Forgalmi rovat',
    lead: 'Szeptember elsejétől a hétvégi vonatok óránként közlekednek.',
    cover: '',
    coverAlt: '',
    featured: false,
    tags: ['menetrend', 'forgalom'],
    slug: '2026-08-14-uj-menetrend-lep-eletbe',
    torzs: 'Az első bekezdés.',
    eredetiSlug: null,
    ...reszlet,
  };
}

/* --- fájlnév ------------------------------------------------------------- */

test('a slug leszedi az ékezeteket és kisbetűsít', () => {
  assert.equal(slugositas('Új váltókezelői szolgálat'), 'uj-valtokezeloi-szolgalat');
  assert.equal(slugositas('Őszi hírek — 2026!'), 'oszi-hirek-2026');
});

test('a fájlnév a dátumot és a címet fűzi össze', () => {
  assert.equal(fajlnevBol('2026-08-14', 'Rekord a vonalon'), '2026-08-14-rekord-a-vonalon');
});

test('a slug nem végződhet és nem kezdődhet kötőjelre', () => {
  const slug = slugositas('  ***Cím***  ');
  assert.ok(slugHelyes(slug), `érvénytelen slug: ${slug}`);
});

/* --- markdown kimenet ---------------------------------------------------- */

test('a kimenetet a saját fejlécolvasónk visszafejti', () => {
  const forras = markdownOsszeallit(piszkozat());
  const { adat, torzs } = frontmatterBont(forras);

  assert.equal(adat.title, 'Új menetrend lép életbe');
  assert.equal(adat.date, '2026-08-14');
  assert.equal(adat.section, 'Vasút');
  assert.equal(adat.lead, 'Szeptember elsejétől a hétvégi vonatok óránként közlekednek.');
  assert.deepEqual(adat.tags, ['menetrend', 'forgalom']);
  assert.equal(torzs, 'Az első bekezdés.');
});

test('a lead a dátum után áll, hogy az indexelő ne rendezze át', () => {
  const sorok = markdownOsszeallit(piszkozat()).split('\n');
  assert.equal(sorok[1].startsWith('title:'), true);
  assert.equal(sorok[2].startsWith('date:'), true);
  assert.equal(sorok[3], 'lead: >');
});

test('az elhagyható mezők kimaradnak, ha üresek', () => {
  const forras = markdownOsszeallit(piszkozat({
    author: '', section: '', lead: '', cover: '', coverAlt: '', tags: [], featured: false,
  }));
  for (const kulcs of ['author:', 'section:', 'lead:', 'cover:', 'coverAlt:', 'tags:', 'featured:']) {
    assert.ok(!forras.includes(kulcs), `nem kellett volna kiírni: ${kulcs}`);
  }
});

test('a featured csak akkor jelenik meg, ha be van kapcsolva', () => {
  assert.ok(markdownOsszeallit(piszkozat({ featured: true })).includes('featured: true'));
});

test('idézőjelbe teszi azt az értéket, amit másként olvasnánk', () => {
  const forras = markdownOsszeallit(piszkozat({ title: '[Kiemelt] hír # 3' }));
  const { adat } = frontmatterBont(forras);
  assert.equal(adat.title, '[Kiemelt] hír # 3');
});

test('a vesszős címke soronkénti listaként íródik ki', () => {
  const forras = markdownOsszeallit(piszkozat({ tags: ['egy, kettő', 'három'] }));
  const { adat } = frontmatterBont(forras);
  assert.deepEqual(adat.tags, ['egy, kettő', 'három']);
});

test('a törzs sorvégeit LF-re állítja, és egy záró sorvéggel zár', () => {
  const forras = markdownOsszeallit(piszkozat({ torzs: 'Egy\r\nkettő' }));
  assert.ok(!forras.includes('\r'));
  assert.ok(forras.endsWith('kettő\n'));
});

/* --- ellenőrzés ---------------------------------------------------------- */

test('hibát jelez a hiányzó cím és a rossz dátum miatt', () => {
  const uzenetek = ellenoriz(piszkozat({ title: '  ', date: '2026.08.14.' }), { ma: MA });
  assert.ok(vanHiba(uzenetek));
  assert.equal(uzenetek.filter((u) => u.szint === 'hiba').length, 2);
});

test('hibát jelez, ha a fájlnév már létezik', () => {
  const cikkek = [{ slug: '2026-08-14-uj-menetrend-lep-eletbe', title: 'Régi', tags: [] }];
  const uzenetek = ellenoriz(piszkozat(), { cikkek, ma: MA });
  assert.ok(uzenetek.some((u) => u.szint === 'hiba' && u.szoveg.includes('Már van cikk')));
});

test('a saját fájlnevét nem tekinti ütközésnek szerkesztéskor', () => {
  const cikkek = [{ slug: '2026-08-14-uj-menetrend-lep-eletbe', title: 'Ugyanez', tags: [] }];
  const uzenetek = ellenoriz(
    piszkozat({ eredetiSlug: '2026-08-14-uj-menetrend-lep-eletbe' }),
    { cikkek, ma: MA },
  );
  assert.ok(!vanHiba(uzenetek));
});

test('a repóban nem létező helyi képet hibaként jelzi', () => {
  const uzenetek = ellenoriz(
    piszkozat({ cover: 'content/images/nincs.svg', coverAlt: 'x' }),
    { kepek: ['content/images/van.svg'], ma: MA },
  );
  assert.ok(uzenetek.some((u) => u.szint === 'hiba' && u.szoveg.includes('nincs a repóban')));
});

test('a távoli https képet elfogadja, a http-t nem', () => {
  const jo = ellenoriz(piszkozat({ cover: 'https://pelda.hu/a.png', coverAlt: 'x' }), { kepek: ['content/images/van.svg'], ma: MA });
  const rossz = ellenoriz(piszkozat({ cover: 'http://pelda.hu/a.png', coverAlt: 'x' }), { ma: MA });
  assert.ok(!vanHiba(jo));
  assert.ok(vanHiba(rossz));
});

test('a jövőbeli dátumot ütemezésként jelzi', () => {
  const uzenetek = ellenoriz(piszkozat({ date: '2026-08-20' }), { ma: MA });
  assert.ok(uzenetek.some((u) => u.szint === 'info' && u.szoveg.includes('ütemezve')));
  assert.ok(!vanHiba(uzenetek));
});

test('figyelmeztet, ha a kiemelés már elévült volna', () => {
  const uzenetek = ellenoriz(piszkozat({ date: '2026-07-01', featured: true, slug: '2026-07-01-regi' }), { ma: MA });
  assert.ok(uzenetek.some((u) => u.szint === 'figyelmeztetes' && u.szoveg.includes('elévül')));
});

test('kiszúrja a csak írásmódban eltérő rovatot', () => {
  const cikkek = [{ slug: 'x', section: 'Vasút', tags: [] }];
  const uzenetek = ellenoriz(piszkozat({ section: 'vasut' }), { cikkek, ma: MA });
  assert.ok(uzenetek.some((u) => u.szoveg.includes('csak írásmódban tér el')));
});

test('figyelmeztet a borítókép leírásának hiányára', () => {
  const uzenetek = ellenoriz(
    piszkozat({ cover: 'content/images/van.svg', coverAlt: '' }),
    { kepek: ['content/images/van.svg'], ma: MA },
  );
  assert.ok(uzenetek.some((u) => u.szoveg.includes('coverAlt')));
});

test('a hibátlan piszkozat nem termel hibát', () => {
  assert.ok(!vanHiba(ellenoriz(piszkozat(), { ma: MA })));
});

test('a még fel nem töltött behúzott kép csak figyelmeztetés, nem hiba', () => {
  const uzenetek = ellenoriz(
    piszkozat({ torzs: '![kép](content/images/friss.png)' }),
    { kepek: ['content/images/van.svg'], helyiKepek: ['content/images/friss.png'], ma: MA },
  );
  assert.ok(!vanHiba(uzenetek), 'nem lehet hiba, hiszen a cikk beküldhető');
  assert.ok(uzenetek.some((u) => u.szint === 'figyelmeztetes' && u.szoveg.includes('fel kell tölteni')));
});

/* --- blokk beszúrása ----------------------------------------------------- */

test('az elválasztó üres sort kap, hogy ne aláhúzás legyen belőle', () => {
  // "Egy bekezdés.\n---" a Markdownban címsort csinál az előző sorból.
  assert.equal(blokkKeret('Egy bekezdés.', '', '---'), '\n\n---\n');
  assert.equal(blokkKeret('Egy bekezdés.\n', '', '---'), '\n---\n');
  assert.equal(blokkKeret('Egy bekezdés.\n\n', '', '---'), '---\n');
});

test('a blokk után is marad üres sor, ha folytatódik a szöveg', () => {
  // A visszatérési érték csak a beszúrandó szöveg; az `utana` már a mezőben van.
  assert.equal(blokkKeret('Előtte.\n\n', 'Utána.', '---'), '---\n\n');
  assert.equal(blokkKeret('Előtte.\n\n', '\nUtána.', '---'), '---\n');
  assert.equal(blokkKeret('Előtte.\n\n', '\n\nUtána.', '---'), '---');
});

test('üres szerkesztőbe beszúrva nem kezd sortöréssel', () => {
  assert.equal(blokkKeret('', '', '---'), '---\n');
});

/* --- közös képmodul ------------------------------------------------------ */

test('a beágyazott képeket Markdownból és HTML-ből is kiszedi', () => {
  const torzs = '![a](content/images/a.svg)\n\n<img src="content/images/b.png" alt="b">';
  assert.deepEqual(beagyazottKepek(torzs), ['content/images/a.svg', 'content/images/b.png']);
});

test('az abszolút és a cikkhez képest relatív útvonalat elutasítja', () => {
  assert.match(kepUtvonalHiba('/content/images/a.svg'), /abszolút/);
  assert.match(kepUtvonalHiba('../images/a.svg'), /relatív/);
  assert.equal(kepUtvonalHiba('content/images/a.svg'), null);
});
