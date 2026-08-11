/**
 * A szerkesztő űrlapja: a fejlécmezők és a Markdown-szerkesztő.
 *
 * Az űrlap **egyszer** épül fel, utána csak a származtatott részek frissülnek
 * (fájlnév, kiválasztott címkék, rovatjelzés). Ha minden változásnál újraépülne,
 * a beírás közben elveszne a kurzor.
 */

import { REPO, UTVONALAK } from '../config.js';
import { elem, urit } from '../dom.js';
import { leadSzarmaztat } from '../lead.js';
import { fajlnevBol, normalizalt } from './slug.js';
import { szovegSzerkesztoEpit } from './szoveg-szerkeszto.js';

export function urlapEpit(tarolo, allapot, adatok) {
  const {
    rovatok = [], cimkek = [], kepek = [], kuratltRovatok = [],
    helyiKepRogzit = () => {},
  } = adatok;

  const cimMezo = elem('input', { type: 'text', osztaly: 'szerk-input', placeholder: 'A cikk címe' });
  const datumMezo = elem('input', { type: 'date', osztaly: 'szerk-input szerk-input--rovid' });
  const rovatMezo = elem('input', { type: 'text', osztaly: 'szerk-input', list: 'rovat-lista', placeholder: 'például Vasút' });
  const szerzoMezo = elem('input', { type: 'text', osztaly: 'szerk-input', list: 'szerzo-lista', placeholder: 'Szerkesztőség' });
  const leadMezo = elem('textarea', { osztaly: 'szerk-textarea szerk-textarea--lead', rows: '3', placeholder: 'Egy-két mondat. Ha üresen hagyod, az első bekezdésből készül.' });
  const boritoMezo = elem('input', { type: 'text', osztaly: 'szerk-input', placeholder: 'content/images/… vagy https://…' });
  const boritoAltMezo = elem('input', { type: 'text', osztaly: 'szerk-input', placeholder: 'Mi látszik a képen?' });
  const kiemeltMezo = elem('input', { type: 'checkbox', osztaly: 'szerk-jelolo' });
  const cimkeMezo = elem('input', { type: 'text', osztaly: 'szerk-input', list: 'cimke-lista', placeholder: 'Címke, majd Enter' });
  const slugMezo = elem('input', { type: 'text', osztaly: 'szerk-input szerk-input--mono' });
  const torzsSzerkeszto = szovegSzerkesztoEpit({ allapot, helyiKepRogzit });

  const kivalasztottCimkek = elem('div', { osztaly: 'szerk-chipsor' });
  const rovatFigyelmeztetes = elem('p', { osztaly: 'szerk-sugo szerk-sugo--uj' });
  const kepValaszto = elem('div', { osztaly: 'szerk-kepracs' });

  tarolo.append(
    elem('datalist', { id: 'rovat-lista' }, rovatok.map((r) => elem('option', { value: r }))),
    elem('datalist', { id: 'cimke-lista' }, cimkek.map((c) => elem('option', { value: c }))),
    elem('datalist', { id: 'szerzo-lista' }, adatok.szerzok?.map((s) => elem('option', { value: s })) ?? []),

    szakasz('A cikk adatai', [
      mezo('Cím', cimMezo, 'Ez jelenik meg a kártyán, a cikk élén és a hírsávban.'),
      elem('div', { osztaly: 'szerk-parban' }, [
        mezo('Dátum', datumMezo, 'Jövőbeli dátum = ütemezett megjelenés.'),
        mezo('Szerző', szerzoMezo),
      ]),
      mezo('Rovat', rovatMezo, 'Pontosan egy. A meglévők közül válassz, vagy írj újat.'),
      chipCsoport(rovatok, (nev) => allapot.frissit({ section: nev })),
      rovatFigyelmeztetes,
      mezo('Lead', leadMezo, null, [
        elem('button', {
          type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk',
          szoveg: 'A szövegből',
          title: 'Ugyanaz, amit az indexelés csinálna, ha üresen hagynád',
          onclick: () => allapot.frissit({ lead: leadSzarmaztat(allapot.get().torzs ?? '') }),
        }),
      ]),
    ]),

    szakasz('Címkék', [
      mezo('Új címke', cimkeMezo, 'Enter a hozzáadáshoz. A meglévőkből is választhatsz.'),
      kivalasztottCimkek,
      elem('p', { osztaly: 'szerk-sugo', szoveg: 'Elérhető címkék:' }),
      chipCsoport(cimkek, (nev) => cimkeHozzaad(nev)),
    ]),

    szakasz('Borítókép', [
      mezo('Útvonal', boritoMezo, 'A lap gyökeréhez képest, vagy https:// cím.', [
        elem('a', {
          osztaly: 'szerk-gomb szerk-gomb--halk',
          href: `https://github.com/${REPO.tulajdonos}/${REPO.nev}/upload/${REPO.ag}/${UTVONALAK.kepMappa}`,
          target: '_blank', rel: 'noopener',
          szoveg: 'Kép feltöltése GitHubon',
          title: 'Megnyitja a content/images mappa feltöltőlapját – oda húzd be a fájlt',
        }),
      ]),
      mezo('Képleírás', boritoAltMezo, 'Egyben képaláírás is a cikkoldalon.'),
      elem('p', { osztaly: 'szerk-sugo', szoveg: kepek.length ? 'A repóban lévő képek:' : 'A repóban nincs kép – adj meg URL-t, vagy töltsd fel a content/images mappába.' }),
      kepValaszto,
    ]),

    szakasz('Megjelenés', [
      elem('label', { osztaly: 'szerk-jelolosor' }, [
        kiemeltMezo,
        elem('span', {}, [
          elem('strong', { szoveg: 'Vezető cikk' }),
          elem('span', { osztaly: 'szerk-sugo', szoveg: ' – a hírfolyam élére kerül, a megjelenés után 14 napig.' }),
        ]),
      ]),
      mezo('Fájlnév', slugMezo, 'Ez lesz a cikk webcíme. Megjelenés után ne változtasd.', [
        elem('button', {
          type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk', szoveg: 'A címből',
          onclick: () => allapot.frissit({ slugKezi: false, slug: fajlnevBol(allapot.get().date, allapot.get().title) }),
        }),
      ]),
    ]),

    szakasz('A cikk szövege', [
      torzsSzerkeszto.gyoker,
    ]),
  );

  kepValasztoEpit();

  /* --- kötések --------------------------------------------------------- */

  kot(cimMezo, 'input', () => {
    const piszkozat = allapot.get();
    const reszlet = { title: cimMezo.value };
    if (!piszkozat.slugKezi) reszlet.slug = fajlnevBol(piszkozat.date, cimMezo.value);
    allapot.frissit(reszlet);
  });

  kot(datumMezo, 'change', () => {
    const piszkozat = allapot.get();
    const reszlet = { date: datumMezo.value };
    if (!piszkozat.slugKezi) reszlet.slug = fajlnevBol(datumMezo.value, piszkozat.title);
    allapot.frissit(reszlet);
  });

  kot(rovatMezo, 'input', () => allapot.frissit({ section: rovatMezo.value }));
  kot(szerzoMezo, 'input', () => allapot.frissit({ author: szerzoMezo.value }));
  kot(leadMezo, 'input', () => allapot.frissit({ lead: leadMezo.value }));
  kot(boritoMezo, 'input', () => allapot.frissit({ cover: boritoMezo.value }));
  kot(boritoAltMezo, 'input', () => allapot.frissit({ coverAlt: boritoAltMezo.value }));
  kot(kiemeltMezo, 'change', () => allapot.frissit({ featured: kiemeltMezo.checked }));
  kot(slugMezo, 'input', () => allapot.frissit({ slug: slugMezo.value, slugKezi: true }));

  cimkeMezo.addEventListener('keydown', (esemeny) => {
    if (esemeny.key !== 'Enter') return;
    esemeny.preventDefault();
    cimkeHozzaad(cimkeMezo.value);
    cimkeMezo.value = '';
  });

  // A kép behúzását a szövegszerkesztő maga kezeli (ott kell a beszúrás
  // helye); itt csak a hova-tegyem tájékoztatót adjuk hozzá.
  torzsSzerkeszto.gyoker.addEventListener('drop', (esemeny) => {
    const fajl = esemeny.dataTransfer?.files?.[0];
    if (fajl?.type?.startsWith('image/')) {
      ejtesUzenet(tarolo, `${UTVONALAK.kepMappa}/${fajl.name}`);
    }
  });

  return { frissit };

  /* --- származtatott részek -------------------------------------------- */

  function frissit(piszkozat) {
    ertekBe(cimMezo, piszkozat.title);
    ertekBe(datumMezo, piszkozat.date);
    ertekBe(rovatMezo, piszkozat.section);
    ertekBe(szerzoMezo, piszkozat.author);
    ertekBe(leadMezo, piszkozat.lead);
    ertekBe(boritoMezo, piszkozat.cover);
    ertekBe(boritoAltMezo, piszkozat.coverAlt);
    ertekBe(slugMezo, piszkozat.slug);
    torzsSzerkeszto.frissit(piszkozat);
    if (kiemeltMezo.checked !== !!piszkozat.featured) kiemeltMezo.checked = !!piszkozat.featured;

    cimkeSorFrissit(piszkozat.tags ?? []);
    rovatJelzesFrissit(piszkozat.section ?? '');
    kepKijelolesFrissit(piszkozat.cover ?? '');
  }

  function cimkeSorFrissit(tagok) {
    urit(kivalasztottCimkek);
    if (!tagok.length) {
      kivalasztottCimkek.append(elem('span', { osztaly: 'szerk-sugo', szoveg: 'Még nincs címke.' }));
      return;
    }
    for (const cimke of tagok) {
      kivalasztottCimkek.append(elem('button', {
        type: 'button', osztaly: 'szerk-chip szerk-chip--aktiv',
        title: 'Eltávolítás',
        onclick: () => allapot.frissit({ tags: allapot.get().tags.filter((c) => c !== cimke) }),
      }, [elem('span', { szoveg: `#${cimke}` }), elem('span', { osztaly: 'szerk-chip__x', szoveg: '×' })]));
    }
  }

  function rovatJelzesFrissit(rovat) {
    const tiszta = rovat.trim();
    rovatFigyelmeztetes.hidden = !tiszta || kuratltRovatok.includes(tiszta) || rovatok.includes(tiszta);
    if (rovatFigyelmeztetes.hidden) return;
    urit(rovatFigyelmeztetes).append(
      elem('span', { szoveg: `A „${tiszta}" új rovat. ` }),
      elem('button', {
        type: 'button', osztaly: 'szerk-gomb szerk-gomb--halk', szoveg: 'rovatok.json másolása',
        onclick: async () => {
          const lista = [...new Set([...kuratltRovatok, tiszta])];
          await navigator.clipboard?.writeText(rovatokJson(lista));
          jelzes(rovatFigyelmeztetes, 'Vágólapra másolva – illeszd be a content/rovatok.json-ba.');
        },
      }),
    );
  }

  function kepValasztoEpit() {
    urit(kepValaszto);
    for (const kep of kepek) {
      kepValaszto.append(elem('button', {
        type: 'button', osztaly: 'szerk-kep', adat: { ut: kep },
        title: kep,
        onclick: () => allapot.frissit({ cover: kep }),
      }, [
        elem('img', { src: `./${kep}`, alt: '', loading: 'lazy' }),
        elem('span', { osztaly: 'szerk-kep__nev', szoveg: kep.split('/').pop() }),
      ]));
    }
    if (kepek.length) {
      kepValaszto.append(elem('button', {
        type: 'button', osztaly: 'szerk-kep szerk-kep--nincs', szoveg: 'Nincs borító',
        onclick: () => allapot.frissit({ cover: '', coverAlt: '' }),
      }));
    }
  }

  function kepKijelolesFrissit(borito) {
    for (const gomb of kepValaszto.querySelectorAll('.szerk-kep')) {
      gomb.classList.toggle('szerk-kep--aktiv', gomb.dataset.ut === borito);
    }
  }

  function cimkeHozzaad(nyers) {
    const cimke = String(nyers).trim().replace(/^#/, '');
    if (!cimke) return;
    const mostaniak = allapot.get().tags ?? [];
    if (mostaniak.some((c) => normalizalt(c) === normalizalt(cimke))) return;
    allapot.frissit({ tags: [...mostaniak, cimke] });
  }
}

/* --- apró építőelemek --------------------------------------------------- */

function szakasz(cim, gyerekek) {
  return elem('section', { osztaly: 'szerk-szakasz' }, [
    elem('h2', { osztaly: 'szerk-szakasz__cim', szoveg: cim }),
    ...gyerekek,
  ]);
}

function mezo(cimke, bemenet, sugo = null, extra = []) {
  return elem('label', { osztaly: 'szerk-mezo' }, [
    elem('span', { osztaly: 'szerk-mezo__cimke' }, [
      elem('span', { szoveg: cimke }),
      ...extra,
    ]),
    bemenet,
    sugo ? elem('span', { osztaly: 'szerk-sugo', szoveg: sugo }) : null,
  ]);
}

function chipCsoport(ertekek, kattintas) {
  return elem('div', { osztaly: 'szerk-chipsor szerk-chipsor--keszlet' },
    ertekek.map((ertek) => elem('button', {
      type: 'button', osztaly: 'szerk-chip', szoveg: ertek,
      onclick: () => kattintas(ertek),
    })));
}

/**
 * A blokkos beszúrás (elválasztó, táblázat) sortörés-számítása.
 *
 * A formázott szerkesztésben már nincs rá szükség – ott a böngésző alakítja ki
 * a blokkokat –, de a „Forrás" mód és a régi cikkek javítása miatt megtartjuk,
 * és a szabály maga is dokumentált: üres sor nélkül a Markdown a `---`-t nem
 * elválasztónak veszi, hanem az előző bekezdés aláhúzásának.
 */
export function blokkKeret(elotte, utana, blokk) {
  let eleje = '';
  if (elotte !== '') {
    if (!elotte.endsWith('\n\n')) eleje = elotte.endsWith('\n') ? '\n' : '\n\n';
  }

  let vege = '';
  if (utana !== '') {
    if (!utana.startsWith('\n\n')) vege = utana.startsWith('\n') ? '\n' : '\n\n';
  } else {
    vege = '\n';
  }

  return `${eleje}${blokk}${vege}`;
}

function ejtesUzenet(tarolo, utvonal) {
  const uzenet = elem('p', { osztaly: 'szerk-ejtes' }, [
    elem('span', { szoveg: `A hivatkozás bekerült, az előnézet már mutatja. A fájl maga még nincs a repóban – ide kell: ${utvonal} ` }),
    elem('a', {
      osztaly: 'szerk-gomb szerk-gomb--halk',
      href: `https://github.com/${REPO.tulajdonos}/${REPO.nev}/upload/${REPO.ag}/${UTVONALAK.kepMappa}`,
      target: '_blank', rel: 'noopener',
      szoveg: 'Feltöltés',
    }),
  ]);
  tarolo.prepend(uzenet);
  setTimeout(() => uzenet.remove(), 12000);
}

function jelzes(csomopont, szoveg) {
  const jel = elem('span', { osztaly: 'szerk-jelzes', szoveg });
  csomopont.append(jel);
  setTimeout(() => jel.remove(), 4000);
}

function rovatokJson(rovatokLista) {
  return `${JSON.stringify({
    megjegyzes: 'A lap rovatai. Ez kézzel gondozott lista: a szerkesztő ezt ajánlja fel, és csak innen, illetve a már megjelent cikkekből ismert rovatokat mutatja. Új rovatot itt vegyél fel, hogy a vocabulary ne cikkenként szaporodjon.',
    rovatok: rovatokLista,
  }, null, 2)}\n`;
}

function kot(csomopont, esemeny, kezelo) {
  csomopont.addEventListener(esemeny, kezelo);
}

/** Csak akkor írunk a mezőbe, ha tényleg más – különben elszáll a kurzor. */
function ertekBe(csomopont, ertek) {
  const uj = ertek ?? '';
  if (csomopont.value !== uj) csomopont.value = uj;
}
