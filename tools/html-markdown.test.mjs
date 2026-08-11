/**
 * A formázott szerkesztő visszafordítása Markdownba.
 *
 * A körbejárás a lényeg: Markdown → HTML (marked, ahogy a lap is teszi) →
 * Markdown. Ha ez nem adja vissza ugyanazt, a szerkesztő csendben átírná a
 * cikkeket – ezért itt minden támogatott jelölésre van eset.
 *
 * A DOM-hoz `jsdom` kell, ami nincs a package.json-ban; nélküle a próba kimarad.
 *   npm install --no-save jsdom
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { htmlbolMarkdown, vedettSzoveg } from '../assets/js/szerkeszto/html-markdown.js';

const GYOKER = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let JSDOM = null;
try { ({ JSDOM } = await import('jsdom')); } catch { /* kimarad */ }

/** A lapon is használt marked, ugyanabból a bemásolt fájlból. */
async function markedBetolt() {
  const forras = await readFile(join(GYOKER, 'vendor', 'marked.min.js'), 'utf8');
  const modul = { exports: {} };
  new Function('module', 'exports', forras)(modul, modul.exports);
  return modul.exports.marked ?? modul.exports;
}

const skip = !JSDOM && 'jsdom nincs telepítve';

test('a Markdown körbejárása nem változtatja meg a cikket', { skip }, async (t) => {
  const marked = await markedBetolt();
  const dom = new JSDOM('<div id="p"></div>');
  globalThis.document = dom.window.document;
  const doboz = dom.window.document.getElementById('p');

  /** Markdown → HTML → Markdown */
  const korbe = (markdown) => {
    doboz.innerHTML = marked.parse(markdown, { gfm: true, breaks: false });
    return htmlbolMarkdown(doboz);
  };

  const esetek = {
    'bekezdés': 'Egy sima bekezdés.',
    'félkövér és dőlt': 'Ez **félkövér**, ez *dőlt*, ez ~~áthúzott~~.',
    'kód a szövegben': 'A `content/images` mappa.',
    'alcím': '## Az új időpontok',
    'kisebb alcím': '### Részletek',
    'lista': '- első\n- második',
    'számozott lista': '1. első\n2. második',
    'idézet': '> Egyvágányú pályán minden perc számít.',
    'elválasztó': '---',
    'hivatkozás': 'Lásd a [menetrendet](https://gyermekvasut.hu).',
    'kép': '![Vonat az alagútnál](content/images/hars-hegyi-alagut.svg)',
    'kódblokk': '```js\nconst x = 1;\n```',
    'több bekezdés': 'Első.\n\nMásodik.',
  };

  for (const [nev, markdown] of Object.entries(esetek)) {
    await t.test(nev, () => assert.equal(korbe(markdown), markdown));
  }

  await t.test('beágyazott lista', () => {
    const markdown = '- első\n  - beágyazott\n- második';
    assert.equal(korbe(markdown), markdown);
  });

  await t.test('táblázat az igazítással együtt', () => {
    const markdown = '| Indulás | Érkezés |\n| :-- | --: |\n| 9:00 | 9:45 |';
    assert.equal(korbe(markdown), markdown);
  });

  await t.test('a behúzott kép a repóbeli útvonalat írja ki, nem a blob címet', () => {
    doboz.innerHTML = '<p><img src="blob:http://localhost/abc-123" data-ut="content/images/friss.png" alt="Friss"></p>';
    assert.equal(htmlbolMarkdown(doboz), '![Friss](content/images/friss.png)');
  });

  await t.test('a szerkesztő üres bekezdései nem hagynak szemetet', () => {
    doboz.innerHTML = '<p>Szöveg.</p><p><br></p><div><br></div>';
    assert.equal(htmlbolMarkdown(doboz), 'Szöveg.');
  });

  await t.test('a nem törhető szóköz sima szóközzé alakul', () => {
    doboz.innerHTML = '<p>Egy két szó</p>';
    assert.equal(htmlbolMarkdown(doboz), 'Egy két szó');
  });

  await t.test('a <div>-ekkel tördelt tartalom is bekezdésekre bomlik', () => {
    doboz.innerHTML = '<div>Első.</div><div>Második.</div>';
    assert.equal(htmlbolMarkdown(doboz), 'Első.\n\nMásodik.');
  });

  await t.test('a böngésző érvénytelen szerkezetét is átveszi', () => {
    // A Chrome insertUnorderedList parancsa <p><ul>…</ul></p>-t hoz létre;
    // sorszintűként kezelve a lista eltűnne a cikkből.
    doboz.innerHTML = '<p><ul><li>első pont</li><li>második</li></ul></p>';
    assert.equal(htmlbolMarkdown(doboz), '- első pont\n- második');
  });

  await t.test('az üres listaelem nem hagy tartalom nélküli pontot', () => {
    doboz.innerHTML = '<ul><li>első</li><li><br></li><li>harmadik</li></ul>';
    assert.equal(htmlbolMarkdown(doboz), '- első\n- harmadik');
  });

  await t.test('a <p>-be zárt idézet és táblázat sem veszik el', () => {
    doboz.innerHTML = '<p><blockquote>Idézet.</blockquote></p>';
    assert.equal(htmlbolMarkdown(doboz), '> Idézet.');
  });

  await t.test('a kemény sortörés megmarad', () => {
    doboz.innerHTML = '<p>Első sor<br>Második sor</p>';
    assert.equal(htmlbolMarkdown(doboz), 'Első sor  \nMásodik sor');
  });

  dom.window.close();
});

test('a repóban lévő cikkek körbejárása sem változtat semmit', { skip }, async (t) => {
  const { readdir } = await import('node:fs/promises');
  const { frontmatterBont } = await import('../assets/js/frontmatter.js');

  const marked = await markedBetolt();
  const dom = new JSDOM('<div id="p"></div>');
  globalThis.document = dom.window.document;
  const doboz = dom.window.document.getElementById('p');

  const mappa = join(GYOKER, 'content', 'cikkek');
  const fajlok = (await readdir(mappa)).filter((f) => f.endsWith('.md'));
  assert.ok(fajlok.length > 0, 'nincs mit ellenőrizni');

  for (const fajl of fajlok) {
    await t.test(fajl, async () => {
      const { torzs } = frontmatterBont(await readFile(join(mappa, fajl), 'utf8'));
      const eredetiHtml = marked.parse(torzs, { gfm: true, breaks: false });

      doboz.innerHTML = eredetiHtml;
      const ujMarkdown = htmlbolMarkdown(doboz);

      // A bekezdésen belüli sortörés Markdownban csak szóköz, a HTML pedig
      // egybefüggő szóközként jeleníti meg – ezért nem a fájl bájtjait, hanem
      // a **megjelenő lapot** hasonlítjuk. (Kódblokkra ez nem volna igaz, de
      // annak pontos körbejárását külön eset ellenőrzi.)
      assert.equal(
        szokozNelkul(marked.parse(ujMarkdown, { gfm: true, breaks: false })),
        szokozNelkul(eredetiHtml),
        'a körbejárás megváltoztatta a megjelenő cikket',
      );

      // És a fájl se boruljon fel: maradjon tördelt, ne legyen egy hosszú sor.
      const leghosszabbSor = Math.max(...ujMarkdown.split('\n').map((sor) => sor.length));
      assert.ok(leghosszabbSor <= 100, `túl hosszú sor keletkezett: ${leghosszabbSor}`);
    });
  }

  dom.window.close();
});

/** A HTML a szóközsorozatokat egynek jeleníti meg; a hasonlításnál ezt követjük. */
function szokozNelkul(html) {
  return html.replace(/\s+/g, ' ').trim();
}

/* --- a védelem tisztán szöveges, jsdom nélkül is fut --------------------- */

test('a jelölőkaraktereket megvédi a szövegben', () => {
  assert.equal(vedettSzoveg('2*3 és a_b'), '2\\*3 és a\\_b');
  assert.equal(vedettSzoveg('# nem címsor'), '\\# nem címsor');
  assert.equal(vedettSzoveg('- nem lista'), '\\- nem lista');
  assert.equal(vedettSzoveg('1. nem sorszám'), '1\\. nem sorszám');
  assert.equal(vedettSzoveg('[nem link]'), '\\[nem link\\]');
});
