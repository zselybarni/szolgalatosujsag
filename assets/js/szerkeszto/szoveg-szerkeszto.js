/**
 * A cikk törzsének szerkesztője: a beírt szöveg **azonnal formázottan**
 * látszik, nem jelölésekkel.
 *
 * A lap forrása továbbra is a Markdown fájl: minden változásnál visszafordítjuk
 * a tartalmat Markdownba, és az kerül a piszkozatba. Így az előnézet, az
 * ellenőrzés, a mentés és a kimenet mind ugyanabból dolgozik, mint eddig.
 *
 * A „Forrás" gombbal átváltható a nyers Markdownra. Ez nem a régi felület
 * maradványa, hanem szükséges kijárat: táblázatot, nyers HTML-t vagy egy
 * elszabadult formázást ott lehet pontosan rendbe tenni.
 */

import { elem, urit } from '../dom.js';
import { htmlbolMarkdown } from './html-markdown.js';

const URES_BEKEZDES = '<p><br></p>';

export function szovegSzerkesztoEpit({ allapot, helyiKepRogzit = () => {} }) {
  /** A legutóbb általunk előállított Markdown – ehhez képest tudjuk, hogy
   *  kívülről érkezett-e a változás (cikk betöltése, piszkozat folytatása). */
  let utolsoSajat = null;
  let forrasMod = false;

  const iras = elem('div', {
    osztaly: 'szerk-iras cikk__torzs',
    contenteditable: 'true',
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-label': 'A cikk szövege',
    spellcheck: 'true',
  });

  const forras = elem('textarea', {
    osztaly: 'szerk-textarea szerk-textarea--torzs',
    rows: '22',
    spellcheck: 'false',
    'aria-label': 'A cikk szövege Markdownban',
    hidden: true,
  });

  const cimPrompt = urlPromptEpit();
  const eszkoztar = eszkoztarEpit();

  const gyoker = elem('div', { osztaly: 'szerk-iras-doboz' }, [
    eszkoztar, cimPrompt.gyoker, iras, forras,
  ]);

  /* --- kötések --------------------------------------------------------- */

  iras.addEventListener('input', () => sajatValtozas(htmlbolMarkdown(iras)));
  forras.addEventListener('input', () => sajatValtozas(forras.value));

  // A beillesztett tartalomból csak a formázást tartjuk meg, a külső
  // stílusokat nem – különben idegen betűtípusok és színek kerülnének a cikkbe.
  iras.addEventListener('paste', (esemeny) => {
    const html = esemeny.clipboardData?.getData('text/html');
    const szoveg = esemeny.clipboardData?.getData('text/plain');
    if (!html && !szoveg) return;
    esemeny.preventDefault();
    document.execCommand('insertHTML', false, html ? tisztitottHtml(html) : szovegbolHtml(szoveg));
  });

  iras.addEventListener('dragover', (esemeny) => esemeny.preventDefault());
  iras.addEventListener('drop', (esemeny) => {
    const fajl = esemeny.dataTransfer?.files?.[0];
    if (!fajl?.type?.startsWith('image/')) return;
    esemeny.preventDefault();

    const utvonal = `content/images/${fajl.name}`;
    helyiKepRogzit(utvonal, fajl);
    // A megjelenítéshez a helyi fájl címét használjuk, a Markdownba viszont a
    // repóbeli útvonal kerül – ezt a data-ut őrzi.
    document.execCommand('insertHTML', false,
      `<img src="${URL.createObjectURL(fajl)}" data-ut="${utvonal}" alt="${fajl.name.replace(/\.[^.]+$/, '')}">`);
  });

  return { gyoker, frissit, fokusz: () => (forrasMod ? forras : iras).focus() };

  /* --- működés --------------------------------------------------------- */

  function sajatValtozas(markdown) {
    utolsoSajat = markdown;
    allapot.frissit({ torzs: markdown });
  }

  /** Kívülről érkező tartalom betöltése; a saját írás közben nem nyúlunk bele. */
  function frissit(piszkozat) {
    const torzs = piszkozat.torzs ?? '';

    // A forrásmezőt mindig együtt tartjuk az állapottal, hogy a „Forrás"-ra
    // váltás azonnal a mostani szöveget mutassa. Írás közben ez nem zavar:
    // olyankor a két érték már megegyezik, tehát nem írunk bele.
    if (forras.value !== torzs) forras.value = torzs;

    if (torzs === utolsoSajat) return;
    utolsoSajat = torzs;
    iras.innerHTML = torzs.trim() ? markdownbolHtml(torzs) : URES_BEKEZDES;
  }

  function modotValt() {
    forrasMod = !forrasMod;
    iras.hidden = forrasMod;
    forras.hidden = !forrasMod;
    eszkoztar.classList.toggle('szerk-eszkoztar--forras', forrasMod);
    // Váltáskor a másik felületet a mostani tartalomból építjük fel.
    const torzs = allapot.get().torzs ?? '';
    if (forrasMod) forras.value = torzs;
    else iras.innerHTML = torzs.trim() ? markdownbolHtml(torzs) : URES_BEKEZDES;
    (forrasMod ? forras : iras).focus();
  }

  /* --- eszköztár ------------------------------------------------------- */

  function eszkoztarEpit() {
    const muveletek = [
      ['F', 'Félkövér', () => parancs('bold')],
      ['D', 'Dőlt', () => parancs('italic')],
      ['Á', 'Áthúzott', () => parancs('strikeThrough')],
      ['H2', 'Alcím', () => blokkFormatum('h2')],
      ['H3', 'Kisebb alcím', () => blokkFormatum('h3')],
      ['¶', 'Sima bekezdés', () => blokkFormatum('p')],
      ['•', 'Lista', () => parancs('insertUnorderedList')],
      ['1.', 'Számozott lista', () => parancs('insertOrderedList')],
      ['❝', 'Idézet', () => blokkFormatum('blockquote')],
      ['🔗', 'Hivatkozás', () => cimPrompt.nyit('Hivatkozás címe', 'https://', (cim) => parancs('createLink', cim))],
      ['🖼', 'Kép', () => cimPrompt.nyit('Kép útvonala', 'content/images/', kepetBeszur)],
      ['⊞', 'Táblázat', () => beszurHtml(TABLA_HTML)],
      ['—', 'Elválasztó', () => beszurHtml('<hr>')],
      ['{ }', 'Kód', kodotBeszur],
    ];

    return elem('div', { osztaly: 'szerk-eszkoztar' }, [
      ...muveletek.map(([jel, nev, muvelet]) => elem('button', {
        type: 'button', osztaly: 'szerk-eszkoz', title: nev, 'aria-label': nev, szoveg: jel,
        // A fókusz a lenyomáskor vándorolna a gombra, és ezzel elveszne a
        // kijelölés, amire a művelet vonatkozik. Ezért már a mousedown-t
        // megállítjuk – a kattintás így is lefut, a kurzor viszont marad.
        onmousedown: (esemeny) => esemeny.preventDefault(),
        onclick: (esemeny) => { esemeny.preventDefault(); muvelet(); },
      })),
      elem('button', {
        type: 'button', osztaly: 'szerk-eszkoz szerk-eszkoz--forras',
        title: 'Váltás a nyers Markdown és a formázott szerkesztés között',
        szoveg: 'Forrás',
        onclick: modotValt,
      }),
    ]);
  }

  function parancs(nev, ertek = null) {
    iras.focus();
    document.execCommand(nev, false, ertek);
    sajatValtozas(htmlbolMarkdown(iras));
  }

  function blokkFormatum(cimke) {
    parancs('formatBlock', `<${cimke}>`);
  }

  function beszurHtml(html) {
    iras.focus();
    document.execCommand('insertHTML', false, html);
    sajatValtozas(htmlbolMarkdown(iras));
  }

  function kepetBeszur(utvonal) {
    beszurHtml(`<img src="${utvonal}" alt="Képleírás">`);
  }

  function kodotBeszur() {
    const kijelolt = document.getSelection()?.toString() ?? '';
    beszurHtml(`<code>${kijelolt || 'kód'}</code>&nbsp;`);
  }
}

const TABLA_HTML = '<table><thead><tr><th>Fejléc</th><th>Fejléc</th></tr></thead>'
  + '<tbody><tr><td>adat</td><td>adat</td></tr></tbody></table><p><br></p>';

/* --- segédek ------------------------------------------------------------- */

function markdownbolHtml(markdown) {
  if (!globalThis.marked) return '';
  return globalThis.marked.parse(markdown, { gfm: true, breaks: false });
}

/**
 * Beillesztett HTML megtisztítása: csak azok a címkék maradnak, amiket a lap
 * Markdownja ismer, és minden attribútum eltűnik a hivatkozás céljain kívül.
 */
function tisztitottHtml(html) {
  const MEGENGEDETT = new Set([
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'DEL', 'S', 'CODE', 'PRE', 'A', 'IMG',
    'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'HR',
    'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
  ]);

  const doboz = document.createElement('div');
  doboz.innerHTML = html;

  for (const csomopont of [...doboz.querySelectorAll('*')]) {
    if (!MEGENGEDETT.has(csomopont.tagName)) {
      csomopont.replaceWith(...csomopont.childNodes);
      continue;
    }
    for (const attributum of [...csomopont.attributes]) {
      const megtart = (csomopont.tagName === 'A' && attributum.name === 'href')
        || (csomopont.tagName === 'IMG' && ['src', 'alt'].includes(attributum.name))
        || (['TH', 'TD'].includes(csomopont.tagName) && attributum.name === 'align');
      if (!megtart) csomopont.removeAttribute(attributum.name);
    }
  }
  return doboz.innerHTML;
}

function szovegbolHtml(szoveg) {
  return szoveg
    .split(/\n{2,}/)
    .map((bekezdes) => `<p>${bekezdes.replace(/[&<>]/g, (jel) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[jel]).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Kis beviteli sáv címekhez – kellemesebb, mint a böngésző prompt ablaka. */
function urlPromptEpit() {
  const bemenet = elem('input', { type: 'text', osztaly: 'szerk-input szerk-input--mono' });
  const cimke = elem('span', { osztaly: 'szerk-mezo__cimke' });
  let atvesz = null;

  const kesz = () => {
    const ertek = bemenet.value.trim();
    gyoker.hidden = true;
    if (ertek && atvesz) atvesz(ertek);
    atvesz = null;
  };

  const gyoker = elem('div', { osztaly: 'szerk-urlsav', hidden: true }, [
    cimke,
    bemenet,
    elem('button', { type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk', szoveg: 'Beszúrás', onclick: kesz }),
    elem('button', {
      type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk', szoveg: 'Mégsem',
      onclick: () => { gyoker.hidden = true; atvesz = null; },
    }),
  ]);

  bemenet.addEventListener('keydown', (esemeny) => {
    if (esemeny.key === 'Enter') { esemeny.preventDefault(); kesz(); }
    if (esemeny.key === 'Escape') { gyoker.hidden = true; atvesz = null; }
  });

  return {
    gyoker,
    nyit(felirat, kezdet, fuggveny) {
      // A kijelölést a parancs kiadásáig meg kell őrizni, ezért csak a
      // beviteli sávot nyitjuk meg, a szerkesztőt nem bántjuk.
      cimke.textContent = felirat;
      bemenet.value = kezdet;
      atvesz = fuggveny;
      gyoker.hidden = false;
      bemenet.focus();
      bemenet.setSelectionRange(bemenet.value.length, bemenet.value.length);
    },
  };
}
