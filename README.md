# 9. Szolgálatos Újság

A 9. Szolgálatos Csoport statikus online lapja a Széchenyi-hegyi
Gyermekvasútról. Markdown fájlokból áll össze, kizárólag kliensoldali
JavaScripttel fut, és GitHub Pages-ről szolgál ki.

- **Lapfej** — bal sarokban az időjárás a Gyermekvasutas Otthon és Tábornál,
  középen a lap neve, jobbra a világos/sötét kapcsoló.
- **Friss hírek** — futó szalag az elmúlt 5 nap híreivel.
- **Hírfolyam** — vezető cikk, rovatválasztó és cikkrács.
- **Időjárás a vonal mentén** — az időjárás-jelzőre kattintva állomásonkénti
  előrejelzés nyílik, Széchenyihegytől Hűvösvölgyig.
- **Frissítési ajánlat** — a félretett laphoz visszatérve szól, ha közben új
  cikk jelent meg.

## Helyi futtatás

```bash
npm start          # jegyzéket épít, majd elindítja: http://localhost:4173
```

A lap `fetch`-csel tölti be a cikkeket, ezért `file://` alól nem működik — kell
a fenti kiszolgáló (vagy bármely más statikus szerver).

További parancsok:

```bash
npm run index      # csak a content/index.json és images.json újraépítése
npm test           # a fejléc-, lead-, kimenet- és ellenőrzéstesztek
```

A tesztek között van egy DOM-os füstpróba is a szerkesztőre
(`tools/szerkeszto-dom.test.mjs`). Ez `jsdom`-ot kér, ami szándékosan **nincs**
a `package.json`-ban, hogy se a lapnak, se a közzétételnek ne legyen
függősége — enélkül a próba egyszerűen kimarad. Ha le akarod futtatni:

```bash
npm install --no-save jsdom && npm test
```

## Szerkesztő

A `szerkeszto.html` a lap saját szerkesztőfelülete. Nincs kiemelten
hivatkozva, de a lábléc jobb szélén ott a bejárata (a halvány ✎ jel).

Amit tud:

- **Formázott szövegírás** — a cikk törzsét úgy írod, ahogy megjelenik: a
  félkövér félkövér, az alcím alcím, a lista lista. Jelöléseket nem kell írni.
  A fájl így is Markdown marad; a „Forrás" gombbal bármikor előhozható a nyers
  szöveg, ha egy táblázatot vagy formázást pontosan kell rendbe tenni.
- **Űrlap a fejléchez** — dátumválasztó, rovatlista, címkék, borítóképválasztó
  a repóban lévő képekből, kiemelés, fájlnév a címből (ékezetek nélkül).
- **Rovatok és címkék** — felsorolja a meglévőket, újat is felvehetsz, és szól,
  ha az új név csak írásmódban tér el egy meglévőtől.
- **Élő előnézet** — cikkoldal, vezető cikk, kártya, hírsáv és a kész Markdown.
  Ezek a lap **valódi** függvényeit és stíluslapját használják, tehát nem
  hasonmások: ha a kártya megjelenése változik, az előnézet magától követi.
- **Ellenőrzés** — ugyanazokat a szabályokat futtatja, amiket az indexelés,
  így a hibák beküldés előtt derülnek ki.
- **Piszkozat** — minden változás mentődik a böngészőben, újratöltés után
  folytatható. Egy cikk puszta *megnyitása* nem számít piszkozatnak, csak a
  tényleges szerkesztés, és két hét után a mentés elévül.
- **Meglévő cikk szerkesztése** — a legördülő listából betölthető bármelyik
  megjelent (és ütemezett) cikk.
- **Cikk törlése** — a betöltött, már megjelent cikk kivehető a repóból. Tokennel
  a szerkesztő maga küldi be a törlést (rákérdez), token nélkül a GitHub saját
  törlőlapját nyitja meg, ahol a commitot te hagyod jóvá. Új, még be nem küldött
  piszkozatnál a gomb nem él – azt az „Új cikk" dobja el.
- **Ctrl+Z** — a szerkesztő az eszköztár műveleteit is a böngésző saját
  visszavonási sorába teszi, így a gombokkal beszúrt szöveg is visszavonható.

A kész fájlt **letöltheted**, **vágólapra másolhatod**, vagy **beküldheted
GitHubon** egy előre kitöltött űrlapon. A szerkesztő a repóba nem ír – az
indoklás a [0006-os ADR](docs/adr/0006-szerkeszto-nem-ir-a-repoba.md)-ban.

### Közzététel egy kattintással (tokennel)

A „Kimenet" alatt van egy külön felnyitható szakasz, amivel a szerkesztő
**maga küldi be** a cikket és a behúzott képeket. Egyszeri előkészítés:

1. Nyisd meg a <https://github.com/settings/personal-access-tokens/new> lapot
   (Settings → Developer settings → Personal access tokens → **Fine-grained**).
2. **Resource owner:** a saját felhasználód. **Repository access:** *Only select
   repositories* → `szolgalatosujsag`.
3. **Repository permissions → Contents:** állítsd *Read and write*-ra. Minden
   más maradhat érintetlen — ennél több jog nem kell, és ne is adj.
4. Adj neki lejáratot (például 90 nap), majd *Generate token*, és másold ki.
5. A szerkesztőben nyisd le a „Közzététel egy kattintással" szakaszt, illeszd be
   a tokent, és nyomd meg a **Token ellenőrzése** gombot. Ha azt írja, hogy
   írhat, kész.

Ezután a **Közzététel** gomb: először feltölti a behúzott képeket, majd a cikket,
és ad egy hivatkozást a commitra. A lap néhány perccel később frissül, amikor a
közzétételi folyamat lefutott.

Ugyanez a token viszi a **Cikk törlése** gombot is: a betöltött cikk fájlját
törli a repóból – rákérdezés után, és csak akkor, ha a fájl közben nem változott
meg. A törlés eredménye ugyanide, a szakasz naplójába kerül.

A token kezelése szándékosan szűkmarkú:

- **nem kerül a piszkozatba**, tehát a mentésbe sem;
- alapesetben csak a memóriában él, újratöltéskor elveszik;
- az „Emlékezz rá a lap bezárásáig" kapcsolóval a böngésző
  munkamenet-tárolójába kerül, ami a lap bezárásakor törlődik — tartós
  `localStorage`-ba szándékosan **nem** tesszük;
- csak `Authorization` fejlécben utazik, a címsorba soha nem kerül;
- a **Token törlése** gomb azonnal kiüríti mindkét helyről.

> Közös vagy idegen gépen ne pipáld be az emlékezést, és a végén nyomj **Token
> törlése**t. Ha egy token mégis kikerül, a GitHubon azonnal visszavonható
> (Settings → Personal access tokens → Revoke), és mivel egyetlen repóra és
> `Contents` jogra szűkített, más nem nyílik meg vele.

### Képek feltöltése

A cikk szövege elmegy az előre kitöltött GitHub-űrlapon, mert az szöveg. A kép
nem: a feltöltőlap fájlt kér, és egy másik oldal fájlválasztóját a böngésző
biztonsági okból nem engedi programból kitölteni — ezt semmilyen trükkel nem
lehet megkerülni kiszolgáló nélkül. Ezért a szerkesztő azt teszi, ami innen
elérhető:

1. A képet behúzhatod a szövegdobozba: beírja a hivatkozást, és az
   **előnézetben azonnal meg is mutatja** a képet (a helyi fájlból).
2. A „Kép feltöltése GitHubon" gomb egyenesen a `content/images` mappa
   feltöltőlapját nyitja meg — oda kell behúzni magát a fájlt.
3. Amíg a kép nincs a repóban, az ellenőrzés figyelmeztetésként emlékeztet rá,
   de nem tiltja le a cikk beküldését.

**Tokennel viszont a képfeltöltés is megy magától**: a Közzététel gomb a behúzott
képeket is beküldi, mert az API bájtokat fogad, nem fájlválasztót. Ilyenkor az
1. pont behúzása elég, a 2. pontra nincs szükség.

> A lap nyilvános, ezért a szerkesztő is az. Ez nem gond: legfeljebb szöveget
> gyárt valakinek a böngészőjében, írási joga nincs. Jelszót szándékosan nem
> tettünk rá, mert kliensoldali JavaScriptben az a forrásból kiolvasható lenne.

## Új cikk írása

> **Részletes útmutató:** [docs/cikkiras.md](docs/cikkiras.md) — minden
> fejlécmező, az összes használható Markdown-jelölés, a képkezelés szabályai,
> az ütemezés és a hibaüzenetek jelentése.
>
> Kézzel sem nehezebb, de ha inkább felületen írnál, ott a
> [szerkesztő](#szerkeszt%C5%91).

1. Hozz létre egy fájlt a `content/cikkek` mappában
   `ÉÉÉÉ-HH-NN-a-cikk-cime.md` néven. A fájlnév adja a cikk webcímét.
2. Írd meg a fejlécet és a szöveget:

```markdown
---
title: A cikk címe
date: 2026-08-09
section: Vasút
author: Szerkesztőség
lead: >
  Egy-két mondat, ami a kártyán és a cikk elején is megjelenik.
cover: content/images/kep.svg      # elhagyható
coverAlt: A kép leírása            # ha van cover, ezt is töltsd ki
featured: true                     # ez lesz a vezető cikk
tags: [forgalom, nyár]
---

A cikk szövege Markdownban.
```

3. `npm run index`, majd nézd meg helyben. Ha jó, küldd be a `main` ágra — a
   közzététel innen automatikus.

Kötelező mező a `title`; dátum nélkül a fájlnév előtagja lép életbe. A borítókép
elhagyható, ilyenkor a cikk tipográfiai csempét kap.

### A lead magától elkészül

Ha nincs `lead` a fejlécben, az indexelő az első bekezdésből ír egyet: átlépi a
címeket, listákat és képeket, kiszedi a Markdown-jelöléseket (a hivatkozás
szövegét megtartja), és mondathatáron rövidít. Akár kézzel írod, akár a
szkript készíti, a leadet `>` blokként, kiegyenlített sorokban **visszaírja a
cikk fájlába** — így a fájlban is azt látod, ami a kártyán megjelenik, és egy
szó átírásával javíthatod. A tördelés nem hagy egybetűs szót a sor végén, a
művelet pedig idempotens: a második futás már nem módosít semmit.

### Képek a szövegben

A képek útvonalát **a lap gyökeréhez képest** kell megadni, mert a böngésző az
`index.html` címéhez viszonyít, nem a Markdown fájléhoz:

```markdown
![Vonat az alagútnál](content/images/hars-hegyi-alagut.svg)
```

Az indexelés hibával leáll, ha a kép nem létezik, ha az útvonal abszolút
(`/content/…` – a projektoldalon eltörne), vagy ha a cikkhez képest relatív
(`../images/…`). Ez a borítóképre és a szövegbe ágyazott képekre egyaránt áll,
így törött kép nem kerül ki a lapra.

Távoli kép is használható – `https://` címmel, borítóként és a szövegben is.
A `http://` címet az indexelés visszautasítja (a https-en futó lap nem töltené
be), a távoli kép meglétét pedig nem tudjuk ellenőrizni: ha a másik oldal
megszűnik, a kép jelzés nélkül eltűnik a cikkből.

### Ütemezés és kiemelés

- **Jövőbeli dátum = ütemezés.** A jövőre datált cikk nem látszik a lapon, és a
  saját napján magától megjelenik — újabb közzététel nélkül, mert a szűrés az
  olvasó böngészőjében fut. Ellenőrizni a `?elonezet=1` címmel lehet
  (`http://localhost:4173/?elonezet=1`), ilyenkor az ütemezett cikkek is látszanak.
- **A `featured` elévül.** A jelölés `HIRFOLYAM.kiemelesNapok` napig (alapból
  14) emeli a cikket a lap élére, utána a legfrissebb cikk veszi vissza a helyét.
  Így egy elfelejtett jelölés nem ragasztja a nyári hírt a lap tetejére télen.

### Mezők

| Mező | Kötelező | Mire való |
| --- | --- | --- |
| `title` | igen | A cikk címe |
| `date` | fájlnévből is jöhet | Megjelenés dátuma (ÉÉÉÉ-HH-NN); jövőbeli dátum = ütemezés |
| `lead` | nem | Ajánlószöveg; üresen hagyva az első bekezdésből készül |
| `section` | nem | Rovat — saját nézetet kap |
| `author` | nem | Szerző vagy rovat neve |
| `tags` | nem | Címkék, az ajánló ezekből dolgozik |
| `cover` / `coverAlt` | nem | Borítókép és a leírása |
| `featured` | nem | `true` esetén ez a vezető cikk – 14 napig |

## Közzététel

A `.github/workflows/deploy.yml` a `main` ágra küldött minden változás után
lefuttatja a teszteket, újraépíti a cikkjegyzéket, és kirakja a lapot a
GitHub Pages-re. Egyszeri teendő a repó beállításainál: **Settings → Pages →
Source: GitHub Actions**.

### Frissesség: mikor látja az olvasó az új cikket

Amint a fenti folyamat lefutott — frissítés, `Ctrl+F5`, várakozás nélkül.
Ez nem magától értetődő: a GitHub Pages `max-age=600`-zal adja ki a `.json`,
`.md` és `.html` fájlokat (a `.js`, `.css` és a képek négy órát kapnak), és a
böngésző ezen az ablakon belül meg sem kérdezi a kiszolgálót. A fejléceket
statikus tárhelyen nem tudjuk átírni, ezért a kliens kér másképp:

- a **cikkjegyzéket** minden betöltésnél újraellenőrizteti (feltételes kérés:
  változatlan fájlnál `304`, nulla bájt);
- a **cikkek törzsét** a jegyzékbeli `verzio` ujjlenyomattal kéri le
  (`…/cikk.md?v=6cde6d25`), így a fájl gyorsítótárazható marad, a módosítása
  viszont új címet kap.

Egy nyitva hagyott lap ettől még a betöltéskori számot mutatná – hiába friss
minden kérés, ha nincs kérés –, ezért a lap magától is körülnéz:
`HIRFOLYAM.frissitesPercek` sűrűséggel (alapból 2 perc), amíg látszik, és akkor
is, amikor az olvasó visszatér egy félretett fülhöz. Ha közben változott a lap,
egy gombbal **szól**: az új cikket megszámolja, a módosultat megnevezi (egy
átírt törzstől a kártyák mit sem változnak, kár lenne azt hinni, hogy a gomb
nem csinált semmit). A hírfolyamot viszont magától nem rendezi át – a csere és
a lap tetejére ugrás az olvasó kattintására történik. A `config.js`-ben
`HIRFOLYAM.frissitesPercek: 0` kikapcsolja az egészet.

A részletek és az elvetett megoldások a
[0008-as ADR](docs/adr/0008-friss-tartalom-a-gyorsitotar-ellenere.md)-ban. Két
dolgot érdemes fejben tartani:

- **A lap kódja (`.js`, `.css`)** a Pages fejléce szerint négy óráig ragadna a
  visszatérő olvasónál. Ezt a lap előtt álló Cloudflare oldja meg: egy
  gyorsítótár-szabály az `/assets/` és `/vendor/` alatt 300 másodperces
  böngésző-TTL-t ír elő. Ha a szabály eltűnik, egy kódváltozás akár négy órát
  is késhet a visszatérő olvasónál – a cikkek megjelenését viszont ez sem
  gátolja.
- **Képet ne cseréljünk azonos néven.** A cím a kép azonosítója; azonos néven
  feltöltött új kép négy óráig a régi maradhat. Új képhez új fájlnevet.

## Felépítés

```
index.html              a váz és az ikonkészlet
szerkeszto.html         a szerkesztőfelület
assets/css/style.css    a teljes megjelenés, világos és sötét paletta
assets/css/szerkeszto.css  a szerkesztő saját keretei
assets/js/              kliensoldali modulok (config, útválasztó, nézetek, időjárás)
assets/js/szerkeszto/   a szerkesztő moduljai
content/cikkek/*.md     a cikkek
content/rovatok.json    a gondozott rovatlista – ezt kézzel szerkeszd
content/index.json      a cikkjegyzék (verziókkal) – a build állítja elő, kézzel ne szerkeszd
content/images.json     a képjegyzék a képválasztóhoz – szintén a build írja
tools/                  jegyzékkészítő, fejlesztői kiszolgáló, tesztek
vendor/marked.min.js    a bemásolt Markdown-értelmező
docs/adr/               miért így épül a lap
docs/cikkiras.md        cikkírási útmutató
docs/meres.md           a mért események és a GA4 beállításuk
CONTEXT.md              a projekt szótára
```

## A lap átnevezése

Minden felirat a `assets/js/config.js` tetején, a `LAP` blokkban él — más
fájlhoz nem kell hozzányúlni:

```js
export const LAP = {
  nev: '9. Szolgálatos Újság',            // lapfej, lábléc, böngészőfül
  alcim: 'Online lapja',                  // a név alatti felirat a lapfejben
  leiras: 'A 9. Szolgálatos Csoport hírei, riportjai.',   // keresőknek
  nyelv: 'hu-HU',
  idozona: 'Europe/Budapest',
};
```

A hírsáv feliratai a `HIRSAV` blokkban állnak (`cimke`, `tartalekCimke`), a
lapfej „logója" pedig maga a kiírt név — külön képfájl nincs hozzá. A
böngészőfülön látszó ikon: `assets/img/favicon.svg`.

Az `index.html` ugyanezeket a szövegeket tartalmazza kiindulásként, hogy
JavaScript nélkül se legyen névtelen a lap, de betöltéskor mindig a
`config.js` győz. Ha a HTML-ben maradt régi név zavar, ott is átírhatod –
a megjelenítést nem befolyásolja.

Ugyanebben a fájlban állítható a hírsáv szabálya (`HIRSAV`), a kiemelés
elévülése (`HIRFOLYAM.kiemelesNapok`), a nyitva hagyott lap frissítési szünete
(`HIRFOLYAM.frissitesPercek`), a lead hossza és tördelése (`LEAD`), valamint a
tábor és az állomások koordinátái (`TABOR`, `ALLOMASOK`).

## Adatforrások

- Időjárás: [Open-Meteo](https://open-meteo.com/) — kulcs és regisztráció nélkül,
  egyetlen kérésben mind a kilenc helyre (tábor + nyolc állomás). A válasz
  15 percig a `localStorage`-ban marad; hálózati hiba esetén a lap a mentett
  adatot mutatja, jelezve, hogy nem friss.
- Állomáskoordináták: [OpenStreetMap](https://www.openstreetmap.org/copyright).
- Látogatottság: Google Analytics 4 (`gtag.js`) – csak az olvasói lapon, a
  szerkesztőn nem. A mérőkód `async`, tehát ha nem tölt be, a lap ugyanúgy
  működik; a sütikről és a hozzájárulásról lásd a
  [0009-es ADR](docs/adr/0009-latogatottsagmeres-google-analytics.md)-t.
  A lap saját eseményeket is küld (melyik cikket olvassák végig, honnan jutnak
  oda, használják-e az időjárás-jelzőt): a lista és a GA4-ben elvégzendő
  egyszeri beállítás a [docs/meres.md](docs/meres.md)-ben.

> A repóban lévő cikkek és a hozzájuk tartozó képek minta gyanánt készültek: a
> lap működését mutatják be, nem a Gyermekvasút hivatalos közleményei.
