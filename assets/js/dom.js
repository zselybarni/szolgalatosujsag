/** Apró DOM-segédek. Minden beszúrt szöveg textContent-en megy be. */

export function elem(tag, tulajdonsagok = {}, gyerekek = []) {
  const csomopont = document.createElement(tag);

  for (const [kulcs, ertek] of Object.entries(tulajdonsagok)) {
    if (ertek === null || ertek === undefined || ertek === false) continue;
    if (kulcs === 'osztaly') csomopont.className = ertek;
    else if (kulcs === 'szoveg') csomopont.textContent = ertek;
    else if (kulcs === 'html') csomopont.innerHTML = ertek;
    else if (kulcs === 'adat') Object.assign(csomopont.dataset, ertek);
    else if (kulcs.startsWith('on')) csomopont.addEventListener(kulcs.slice(2), ertek);
    else if (ertek === true) csomopont.setAttribute(kulcs, '');
    else csomopont.setAttribute(kulcs, ertek);
  }

  for (const gyerek of [].concat(gyerekek)) {
    if (gyerek === null || gyerek === undefined || gyerek === false) continue;
    csomopont.append(typeof gyerek === 'string' ? document.createTextNode(gyerek) : gyerek);
  }
  return csomopont;
}

/** SVG `<use>` hivatkozás a lapba ágyazott ikonkészletre. */
export function ikon(azonosito, osztaly = 'ikon') {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', osztaly);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#${azonosito}`);
  svg.append(use);
  return svg;
}

export function urit(csomopont) {
  csomopont.replaceChildren();
  return csomopont;
}

/**
 * Gyerekek hozzáfűzése úgy, hogy az elhagyott részek eltűnjenek.
 *
 * Az `append(null)` a DOM-ban nem kihagyást jelent, hanem beszúr egy „null"
 * szövegcsomót – ezért a feltételesen megjelenő blokkokat mindig ezen
 * keresztül fűzzük hozzá, ne közvetlenül.
 */
export function hozzafuz(csomopont, ...gyerekek) {
  const szurt = gyerekek.filter((gyerek) => gyerek !== null && gyerek !== undefined && gyerek !== false);
  if (szurt.length) csomopont.append(...szurt);
  return csomopont;
}
