/**
 * HTML → Markdown fordítás.
 *
 * A szerkesztő formázott szöveget mutat, de a lap forrása továbbra is a
 * Markdown fájl. Ez a modul a kettő közötti átjáró: a szerkesztőben látott
 * tartalmat visszaírja Markdownba, pontosan azt a jelöléskészletet használva,
 * amit a lap ismer (lásd docs/cikkiras.md).
 *
 * Amit nem tud visszaadni – például egy kézzel írt nyers HTML-blokk finom
 * szerkezetét –, azt a szerkesztő „Forrás" módjában lehet kézben tartani.
 */

/** A cikkfájlokban szokásos sorhossz – ehhez tördeljük vissza a bekezdéseket. */
const SOR_SZELESSEG = 80;

const BLOKK_CIMKEK = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'HR', 'TABLE', 'FIGURE',
]);

/**
 * @param {ParentNode} gyoker a szerkesztő tartalma
 * @returns {string} Markdown, LF sorvégekkel
 */
export function htmlbolMarkdown(gyoker) {
  const blokkok = [];
  for (const csomopont of gyoker.childNodes) {
    const szoveg = blokk(csomopont);
    if (szoveg !== null && szoveg.trim() !== '') blokkok.push(szoveg);
  }
  return blokkok.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* --- blokkszintű elemek -------------------------------------------------- */

function blokk(csomopont) {
  if (csomopont.nodeType === 3) {
    const szoveg = sorbaZar(csomopont.textContent);
    return szoveg ? vedettSzoveg(szoveg) : null;
  }
  if (csomopont.nodeType !== 1) return null;

  switch (csomopont.tagName) {
    case 'H1': case 'H2': return `## ${sorosit(csomopont)}`;
    case 'H3': return `### ${sorosit(csomopont)}`;
    case 'H4': case 'H5': case 'H6': return `#### ${sorosit(csomopont)}`;

    case 'HR': return '---';

    case 'UL': case 'OL':
      return listaSorok(csomopont, 0).join('\n');

    case 'BLOCKQUOTE': {
      const belso = htmlbolMarkdown(csomopont);
      return belso.split('\n').map((sor) => (sor ? `> ${sor}` : '>')).join('\n');
    }

    case 'PRE': {
      const kod = csomopont.textContent.replace(/\n$/, '');
      const nyelv = /language-(\w+)/.exec(csomopont.querySelector('code')?.className ?? '')?.[1] ?? '';
      return `\`\`\`${nyelv}\n${kod}\n\`\`\``;
    }

    case 'TABLE': return tablazat(csomopont);

    // Bekezdés, <div> és minden más: ha blokkszintű gyereke van, tartályként
    // bontjuk tovább. Erre szükség van, mert a böngésző szerkesztőparancsai
    // néha érvénytelen szerkezetet hoznak létre – a lista beszúrása például
    // <p><ul>…</ul></p>-t –, és ilyenkor sorszintűként kezelve a lista
    // nyomtalanul eltűnne a Markdownból.
    default: {
      const vanBlokkGyerek = [...csomopont.children].some((gy) => BLOKK_CIMKEK.has(gy.tagName));
      return vanBlokkGyerek ? htmlbolMarkdown(csomopont) : bekezdes(csomopont);
    }
  }
}

function bekezdes(elem) {
  const szoveg = sorosit(elem);
  return szoveg.trim() ? bekezdestTordel(szoveg) : null;
}

/**
 * A bekezdést a repóban szokásos szélességre tördeljük.
 *
 * Markdownban a bekezdésen belüli sortörés csak szóköz, tehát a jelentés nem
 * változik – viszont a cikkfájlok kézzel is olvashatók maradnak, és egy
 * szerkesztőben megnyitott régi cikk nem fordul át egyetlen hosszú sorba,
 * ami az egész bekezdést átírt sornak látszana a verziókövetésben.
 */
function bekezdestTordel(szoveg, szelesseg = SOR_SZELESSEG) {
  // A kemény sortörés jelölése két szóköz a sor végén – ezt a tördelés nem
  // eheti meg, ezért a szakaszokat külön tördeljük, és a jelölést visszatesszük.
  return szoveg
    .split(/ {2}\n/)
    .map((szakasz) => szakasztTordel(szakasz.trim(), szelesseg))
    .join('  \n');
}

function szakasztTordel(szakasz, szelesseg) {
  const sorok = [];
  let mostani = '';
  for (const szo of szakasz.split(/\s+/).filter(Boolean)) {
    if (!mostani) mostani = szo;
    else if (`${mostani} ${szo}`.length <= szelesseg) mostani += ` ${szo}`;
    else { sorok.push(mostani); mostani = szo; }
  }
  if (mostani) sorok.push(mostani);

  // A tördelés után kezdődhet a sor olyan jellel, amit a Markdown blokk-
  // jelölésnek látna; a folytatósorokban ezt is megvédjük.
  return sorok.map((sor, i) => (i === 0 ? sor : sorKezdetVedelem(sor))).join('\n');
}

function sorKezdetVedelem(sor) {
  return sor
    .replace(/^(#{1,6}\s)/, '\\$1')
    .replace(/^([-+>])(\s)/, '\\$1$2')
    .replace(/^(\d+)(\.\s)/, '$1\\$2');
}

function listaSorok(lista, szint) {
  const behuzas = '  '.repeat(szint);
  const rendezett = lista.tagName === 'OL';
  const sorok = [];
  let szamlalo = Number(lista.getAttribute('start') ?? 1);

  for (const tetel of lista.children) {
    if (tetel.tagName !== 'LI') continue;

    const sajat = [];
    const alListak = [];
    for (const gyerek of tetel.childNodes) {
      if (gyerek.nodeType === 1 && (gyerek.tagName === 'UL' || gyerek.tagName === 'OL')) alListak.push(gyerek);
      else sajat.push(gyerek);
    }

    const tartalom = sajat.map(sorszintu).join('').trim();

    // Az üres listaelem (két Enter a lista végén) ne hagyjon maga után egy
    // tartalom nélküli pontot a cikkben.
    if (tartalom || alListak.length) {
      const jel = rendezett ? `${szamlalo}. ` : '- ';
      szamlalo += 1;
      sorok.push(`${behuzas}${jel}${jelolonelkuliElsoSor(tartalom)}`.trimEnd());
    }

    for (const alLista of alListak) sorok.push(...listaSorok(alLista, szint + 1));
  }
  return sorok;
}

/** A több sorba tört listaelem-szöveget egy sorba hozzuk. */
function jelolonelkuliElsoSor(szoveg) {
  return szoveg.replace(/\s*\n\s*/g, ' ');
}

function tablazat(tabla) {
  const sorok = [...tabla.querySelectorAll('tr')];
  if (!sorok.length) return null;

  const cellak = (sor) => [...sor.children].map((cella) => sorosit(cella).replace(/\|/g, '\\|').trim());
  // Igazítást csak ott jelölünk, ahol tényleg be van állítva: a jelöletlen
  // oszlopból ne legyen „balra igazított", mert az fölöslegesen átírná a fájlt.
  const igazitas = (sor) => [...sor.children].map((cella) => {
    const ertek = cella.getAttribute('align') || cella.style?.textAlign || '';
    if (ertek === 'center') return ':-:';
    if (ertek === 'right') return '--:';
    if (ertek === 'left') return ':--';
    return '---';
  });

  const fejlec = cellak(sorok[0]);
  const kimenet = [`| ${fejlec.join(' | ')} |`, `| ${igazitas(sorok[0]).join(' | ')} |`];
  for (const sor of sorok.slice(1)) kimenet.push(`| ${cellak(sor).join(' | ')} |`);
  return kimenet.join('\n');
}

/* --- sorszintű elemek ---------------------------------------------------- */

function sorosit(elem) {
  return [...elem.childNodes].map(sorszintu).join('');
}

function sorszintu(csomopont) {
  if (csomopont.nodeType === 3) return vedettSzoveg(sorbaZar(csomopont.textContent));
  if (csomopont.nodeType !== 1) return '';

  switch (csomopont.tagName) {
    case 'BR': return '  \n';
    case 'STRONG': case 'B': return korbe(csomopont, '**');
    case 'EM': case 'I': return korbe(csomopont, '*');
    case 'DEL': case 'S': case 'STRIKE': return korbe(csomopont, '~~');
    case 'CODE': return `\`${csomopont.textContent}\``;

    case 'A': {
      const cim = csomopont.getAttribute('href') ?? '';
      const szoveg = sorosit(csomopont) || cim;
      return cim ? `[${szoveg}](${cim})` : szoveg;
    }

    case 'IMG': {
      // A behúzott, még fel nem töltött kép a megjelenítéshez a helyi fájlra
      // mutat (blob:), a Markdownba viszont a repóbeli útvonal kell – azt a
      // data-ut attribútum hordozza.
      const cim = csomopont.dataset?.ut || csomopont.getAttribute('src') || '';
      return cim ? `![${csomopont.getAttribute('alt') ?? ''}](${cim})` : '';
    }

    // Bekezdés sorszintű helyzetben (például listaelemben): a tartalma számít.
    default: return sorosit(csomopont);
  }
}

/** A jelölést csak akkor tesszük ki, ha van mit körbevenni. */
function korbe(elem, jel) {
  const belso = sorosit(elem);
  if (!belso.trim()) return belso;
  // A jelölés nem lóghat túl a szóközökön, különben a Markdown nem ismeri fel.
  const [, eleje, torzs, vege] = /^(\s*)([\s\S]*?)(\s*)$/.exec(belso);
  return `${eleje}${jel}${torzs}${jel}${vege}`;
}

/* --- szöveg ------------------------------------------------------------- */

/** A nem törhető szóközt és a sortöréseket rendes szóközzé alakítjuk. */
function sorbaZar(szoveg) {
  return szoveg.replace(/ /g, ' ').replace(/[\t\r\n]+/g, ' ');
}

/**
 * A szövegben előforduló jelölőkaraktereket megvédjük, hogy a Markdown ne
 * formázásnak olvassa őket. Csak azokat, amiket tényleg félreértene.
 */
export function vedettSzoveg(szoveg) {
  return szoveg
    .replace(/([\\`*_[\]])/g, '\\$1')
    .replace(/^(\s*)(#{1,6}\s)/, '$1\\$2')
    .replace(/^(\s*)([-+>])(\s)/, '$1\\$2$3')
    .replace(/^(\s*)(\d+)(\.\s)/, '$1$2\\$3');
}
