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
elhagyható, ilyenkor a cikk tipográfiai csempét kap. Ha a megadott kép nem
létezik, az indexelés hibával leáll — így nem kerül ki törött kép a lapra.

### Mezők

| Mező | Kötelező | Mire való |
| --- | --- | --- |
| `title` | igen | A cikk címe |
| `date` | fájlnévből is jöhet | Megjelenés dátuma (ÉÉÉÉ-HH-NN) |
| `lead` | nem | Ajánlószöveg a kártyán és a cikk elején |
| `section` | nem | Rovat — saját nézetet kap |
| `author` | nem | Szerző vagy rovat neve |
| `tags` | nem | Címkék, az ajánló ezekből dolgozik |
| `cover` / `coverAlt` | nem | Borítókép és a leírása |
| `featured` | nem | `true` esetén ez lesz a vezető cikk |

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

A `assets/js/config.js` egyetlen fájlban tartja a lap nevét, a hírsáv
szabályait, valamint a tábor és az állomások koordinátáit.

## Adatforrások

- Időjárás: [Open-Meteo](https://open-meteo.com/) — kulcs és regisztráció nélkül,
  egyetlen kérésben mind a kilenc helyre (tábor + nyolc állomás). A válasz
  15 percig a `localStorage`-ban marad; hálózati hiba esetén a lap a mentett
  adatot mutatja, jelezve, hogy nem friss.
- Állomáskoordináták: [OpenStreetMap](https://www.openstreetmap.org/copyright).

> A repóban lévő cikkek és a hozzájuk tartozó képek minta gyanánt készültek: a
> lap működését mutatják be, nem a Gyermekvasút hivatalos közleményei.
