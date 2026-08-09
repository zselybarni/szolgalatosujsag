# Hírfolyam

A Széchenyi-hegyi Gyermekvasút statikus online lapja. Markdown fájlokból áll
össze, kizárólag kliensoldali JavaScripttel fut, és GitHub Pages-ről szolgál ki.

- **Lapfej** — bal sarokban az időjárás a Gyermekvasutas Otthon és Tábornál,
  középen a lap neve, jobbra a világos/sötét kapcsoló.
- **Friss címek** — futó szalag az elmúlt 5 nap híreivel.
- **Hírfolyam** — vezető cikk, rovatválasztó és cikkrács.
- **Időjárás a vonal mentén** — az időjárás-jelzőre kattintva állomásonkénti
  előrejelzés nyílik, Széchenyihegytől Hűvösvölgyig.

## Helyi futtatás

```bash
npm start          # jegyzéket épít, majd elindítja: http://localhost:4173
```

A lap `fetch`-csel tölti be a cikkeket, ezért `file://` alól nem működik — kell
a fenti kiszolgáló (vagy bármely más statikus szerver).

További parancsok:

```bash
npm run index      # csak a content/index.json újraépítése
npm test           # a fejlécértelmező tesztjei
```

## Új cikk írása

> **Részletes útmutató:** [docs/cikkiras.md](docs/cikkiras.md) — minden
> fejlécmező, az összes használható Markdown-jelölés, a képkezelés szabályai,
> az ütemezés és a hibaüzenetek jelentése.

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

## Felépítés

```
index.html              a váz és az ikonkészlet
assets/css/style.css    a teljes megjelenés, világos és sötét paletta
assets/js/              kliensoldali modulok (config, útválasztó, nézetek, időjárás)
content/cikkek/*.md     a cikkek
content/index.json      a cikkjegyzék – a build állítja elő, kézzel ne szerkeszd
tools/                  jegyzékkészítő, fejlesztői kiszolgáló, tesztek
vendor/marked.min.js    a bemásolt Markdown-értelmező
docs/adr/               miért így épül a lap
CONTEXT.md              a projekt szótára
```

## A lap átnevezése

Minden felirat a `assets/js/config.js` tetején, a `LAP` blokkban él — más
fájlhoz nem kell hozzányúlni:

```js
export const LAP = {
  nev: 'Hírfolyam',                       // lapfej, lábléc, böngészőfül
  alcim: 'A Gyermekvasút lapja',          // a név alatti felirat a lapfejben
  lablec: 'A Széchenyi-hegyi Gyermekvasút lapja',
  leiras: 'A Széchenyi-hegyi Gyermekvasút hírei, …',   // keresőknek
  nyelv: 'hu-HU',
  idozona: 'Europe/Budapest',
};
```

Az `index.html` ugyanezeket a szövegeket tartalmazza kiindulásként, hogy
JavaScript nélkül se legyen névtelen a lap, de betöltéskor mindig a
`config.js` győz. Ha a HTML-ben maradt régi név zavar, ott is átírhatod –
a megjelenítést nem befolyásolja.

Ugyanebben a fájlban állítható a hírsáv szabálya (`HIRSAV`), a kiemelés
elévülése (`HIRFOLYAM.kiemelesNapok`), a lead hossza és tördelése (`LEAD`),
valamint a tábor és az állomások koordinátái (`TABOR`, `ALLOMASOK`).

## Adatforrások

- Időjárás: [Open-Meteo](https://open-meteo.com/) — kulcs és regisztráció nélkül,
  egyetlen kérésben mind a kilenc helyre (tábor + nyolc állomás). A válasz
  15 percig a `localStorage`-ban marad; hálózati hiba esetén a lap a mentett
  adatot mutatja, jelezve, hogy nem friss.
- Állomáskoordináták: [OpenStreetMap](https://www.openstreetmap.org/copyright).

> A repóban lévő cikkek és a hozzájuk tartozó képek minta gyanánt készültek: a
> lap működését mutatják be, nem a Gyermekvasút hivatalos közleményei.
