# Cikkírás — teljes útmutató

[Markdown Előnézet](https://markdownlivepreview.com/)

Ez a leírás mindent tartalmaz, ami egy cikk megírásához kell: a fájl nevétől a
fejlécmezőkön át a szövegben használható jelölésekig. A példák a lapon
használt valódi beállításokkal működnek.

- [Gyorsindítás](#gyorsindítás)
- [A fájl neve és a cikk webcíme](#a-fájl-neve-és-a-cikk-webcíme)
- [A fejléc](#a-fejléc)
- [A lead](#a-lead)
- [A szöveg jelölései](#a-szöveg-jelölései)
- [Képek](#képek)
- [Rovat és címke](#rovat-és-címke)
- [Kiemelés, ütemezés, hírsáv](#kiemelés-ütemezés-hírsáv)
- [Ellenőrzés és közzététel](#ellenőrzés-és-közzététel)
- [Hibaüzenetek](#hibaüzenetek)
- [Teljes példa](#teljes-példa)

---

> **Nem kell jelöléseket írnod.** A `szerkeszto.html` (a bejárata a lábléc
> halvány ✎ jele) ugyanezt a fájlt állítja össze: a fejlécet űrlapon, a szöveget
> pedig **formázottan** – a félkövér félkövérnek látszik, nem `**így**`.
>
> Ez a leírás ettől nem lesz feleslegesebb. Egyrészt a fájl formátuma
> változatlanul az itt leírt Markdown, tehát kézzel is szerkeszthető. Másrészt a
> szerkesztő „Forrás" gombja pontosan ezt a nyers szöveget nyitja meg – oda
> érdemes benézni, ha egy táblázat vagy egy formázás nem úgy sikerül, ahogy
> szeretnéd. Az alábbi jelölések mind ott is érvényesek.

## Gyorsindítás

1. Hozz létre egy fájlt: `content/cikkek/2026-08-14-uj-menetrend.md`
2. Írd meg a fejlécet és a szöveget (lásd lent).
3. Futtasd: `npm start` — ez frissíti a cikkjegyzéket, és elindítja a lapot a
   <http://localhost:4173> címen.
4. Ha jó, küldd be a `main` ágra. A közzététel onnan automatikus.

A legrövidebb működő cikk mindössze ennyi:

```markdown
---
title: Új menetrend lép életbe
---

Szeptember elsejétől a hétvégi vonatok óránként közlekednek.
```

A dátum a fájlnévből jön, a lead az első bekezdésből — a többi mező elhagyható.

---

## A fájl neve és a cikk webcíme

A fájl a `content/cikkek` mappában él, kiterjesztése `.md`, neve pedig
**dátummal kezdődik**:

```
2026-08-14-uj-menetrend.md
└──┬─────┘ └──────┬─────┘
   dátum         cím rövidítve
```

- A fájlnév adja a cikk webcímét: `#/cikk/2026-08-14-uj-menetrend`
- Csak kisbetűt, számot és kötőjelet használj. Ékezetet és szóközt ne — azok a
  webcímben csúf `%C3%BA` alakúra kódolódnak.
- **A fájlnevet megjelenés után ne írd át**: a korábban megosztott
  hivatkozások eltörnének.
- Két cikknek nem lehet azonos a neve; az indexelés ezt hibával jelzi.

---

## A fejléc

A fájl elején, két `---` sor között állnak a cikk adatai:

```markdown
---
title: Új menetrend lép életbe
date: 2026-08-14
section: Vasút
author: Forgalmi rovat
lead: >
  Szeptember elsejétől a hétvégi vonatok óránként közlekednek,
  a hétköznapi menetrend nem változik.
cover: content/images/menetrend.svg
coverAlt: Menetrendi tábla a széchenyihegyi állomáson
featured: true
tags: [menetrend, forgalom]
---
```

### A mezők

| Mező | Kötelező | Típus | Mire való |
| --- | --- | --- | --- |
| `title` | **igen** | szöveg | A cikk címe. Ez jelenik meg a kártyán, a cikk élén és a hírsávban. |
| `date` | nem¹ | `ÉÉÉÉ-HH-NN` | Megjelenés napja. Jövőbeli dátum = ütemezés. |
| `lead` | nem² | szöveg | Ajánló a kártyán és a cikk elején. |
| `section` | nem | szöveg | Rovat. Pontosan egy lehet. Saját nézetet kap. |
| `author` | nem | szöveg | Szerző vagy rovat neve. |
| `tags` | nem | lista | Címkék. Az „Olvasd el ezt is" ajánló ezekből dolgozik. |
| `cover` | nem | útvonal | Borítókép. |
| `coverAlt` | nem | szöveg | A borítókép leírása; képaláírásként is megjelenik. |
| `featured` | nem | `true`/`false` | A cikk a hírfolyam élére kerül — 14 napig. |

¹ Ha nincs `date`, a fájlnév dátumelőtagja lép életbe. Ha egyik sincs, az
indexelés hibát jelez.
² Ha nincs `lead`, az első bekezdésből készül — lásd [A lead](#a-lead).

### A fejléc írásmódja

A fejléc a YAML egy szűk, kiszámítható részhalmazát ismeri.

**Egyszerű érték.** Az idézőjel általában elhagyható, kettőspontot is
tartalmazhat:

```yaml
title: Menetrend: így készül        # működik
title: "Menetrend: így készül"      # ez is, és egyértelműbb
```

Idézőjel **kell**, ha az érték

- szögletes zárójellel kezdődik (`[…]` — azt listának olvasnánk),
- csupán egyetlen `>` vagy `|` jel (azok hosszú szöveget nyitnak),
- vagy szóközzel elválasztott `#` van benne (`Vonat # 3`), mert az utána
  következő részt megjegyzésnek vennénk.

**Igen/nem és szám.**

```yaml
featured: true
featured: false
```

**Lista** — két írásmód, egyenértékűek:

```yaml
tags: [menetrend, forgalom]
```

```yaml
tags:
  - menetrend
  - forgalom
```

**Hosszú szöveg** — a `>` a sortöréseket szóközzé alakítja, azaz egyetlen
bekezdéssé olvad össze. A folytatás sorait két szóközzel kell beljebb kezdeni:

```yaml
lead: >
  Szeptember elsejétől a hétvégi vonatok óránként közlekednek,
  a hétköznapi menetrend nem változik.
```

A `|` megtartaná a sortöréseket, de a leadnél nincs értelme: a lap egyetlen
bekezdésként jeleníti meg, és az indexelő `>` alakra normalizálja.

**Megjegyzés** külön sorban:

```yaml
# ezt a sort nem olvassa a lap
```

---

## A lead

A lead a cikk egybekezdéses ajánlója. Két helyen látszik: a hírfolyam
kártyáján és a cikk élén, a cím alatt, zöld vonallal megjelölve.

**Nem kötelező megírni.** Ha kihagyod, az indexelő az első bekezdésből készít
egyet:

- átlépi a címsort, a képet, a listát, az idézetet, a táblázatot és a kódot;
- kiszedi a Markdown-jelöléseket, de a hivatkozás szövegét megtartja;
- 240 jelnél mondathatáron rövidít.

**A leadet az indexelő visszaírja a cikk fájlába**, kiegyenlített sorokra
tördelve — akkor is, ha te írtad. Vagyis ha `npm run index` után változik a
fájl, az nem hiba: így a fájlban is azt látod, ami a lapon megjelenik, és egy
szó átírásával javíthatod. A művelet ismételhető: a második futás már nem
módosít semmit.

> **Jó lead:** egy-két mondat, 120–200 jel. Elmondja, mi történt, és miért
> érdekes — nem ismétli meg szó szerint a címet.

---

## A szöveg jelölései

A szöveg Markdownban készül. Az alábbi jelöléseket a lap biztosan ismeri.

### Bekezdés és sortörés

Az üres sor kezd új bekezdést. **Az egyszerű sortörés nem számít**: a
következő két sor egyetlen bekezdésbe olvad.

```markdown
Ez a sor
és ez a sor egy bekezdés lesz.
```

Ha mégis sortörés kell, zárd a sort **két szóközzel**:

```markdown
Első sor··
Második sor
```

### Címsorok

A cikk címét a fejléc `title` mezője adja, ezért a szövegben **`##`-tól
kezdd** a címsorokat:

```markdown
## Fő alcím

### Kisebb alcím
```

### Kiemelés

```markdown
**félkövér**   *dőlt*   ~~áthúzott~~   `kód a szövegben`
```

### Listák

```markdown
- pont egy
- pont kettő
  - beágyazott pont (két szóköz behúzás)

1. első
2. második

- [ ] nyitott feladat
- [x] elvégzett feladat
```

### Hivatkozások

```markdown
[Külső oldal](https://gyermekvasut.hu)
[Másik cikkünk](#/cikk/2026-08-09-rekordot-dontott-a-nyari-forgalom)
[A Vasút rovat](#/rovat/Vasút)
```

- A **külső** hivatkozás magától új lapon nyílik.
- A **belső** hivatkozás `#/cikk/<fájlnév kiterjesztés nélkül>` alakú; a rovat
  nevét ékezettel is írhatod.
- A csupasz webcím magától hivatkozássá alakul: `https://gyermekvasut.hu`

### Idézet

```markdown
> A legnagyobb forgalmat a jó látási viszonyok hozzák.
```

Kék vonallal, dőlten jelenik meg. Külön szerző-sor formázás nincs, a nevet a
szövegbe írd.

### Táblázat

Az elválasztó sorban a kettőspont állítja az oszlop igazítását:

```markdown
| Indulás | Érkezés | Keresztezés |
| :------ | :-----: | ----------: |
| 9:00    | 9:45    | Virágvölgy  |
| 10:00   | 10:45   | Szépjuhászné |
```

`:--` balra, `:-:` középre, `--:` jobbra. A sorok hossza nem kell hogy
egyezzen, elég ha a `|` jelek megvannak.

### Kódrészlet

````markdown
```js
const x = 1;
```
````

### Vízszintes elválasztó

```markdown
---
```

### Nyers HTML és a jelölések kikapcsolása

HTML-t is írhatsz a szövegbe, ha valami nem megy Markdownnal. Ha egy
jelölőkaraktert szó szerint akarsz látni, tedd elé a `\` jelet:

```markdown
<div class="sajat">Saját doboz.</div>

Ez itt \*nem dőlt\*, hanem csillagok között áll.
```

### Amit **nem** ismer

- **Lábjegyzet** (`[^1]`): a lap szó szerint kiírja, nem alakítja lábjegyzetté.
  Használj helyette zárójeles megjegyzést vagy hivatkozást.
- Képaláírás a szövegbe ágyazott képhez — csak a borítókép kap aláírást.

---

## Képek

### Hova tegyem?

A lap képei a `content/images` mappában laknak. Ajánlott méret: legfeljebb
1600 képpont széles, 16:9 körüli arány. Formátum: `svg` rajzhoz, `webp` vagy
`jpg` fényképhez.

### Az útvonalat mihez képest adom meg?

**Mindig a lap gyökeréhez képest** — nem a Markdown fájlhoz. A böngésző az
`index.html` címéhez viszonyít, ezért:

```markdown
![Vonat az alagútnál](content/images/hars-hegyi-alagut.svg)   ✔ jó
![Vonat](../images/hars-hegyi-alagut.svg)                     ✘ hibát jelez
![Vonat](/content/images/hars-hegyi-alagut.svg)               ✘ hibát jelez
```

Az abszolút (`/`-rel kezdődő) útvonal azért rossz, mert a lap egy
alkönyvtárban fut (`…github.io/szolgalatosujsag/`), és a `/` a tartomány
gyökerére mutatna.

### Kell-e helyben lennie a képnek?

**Nem.** Más kiszolgálón lévő kép is használható, borítóként és a szövegben is:

```markdown
cover: https://pelda.hu/kepek/vonat.jpg
![Vonat](https://pelda.hu/kepek/vonat.jpg)
```

Két megkötéssel:

- **Csak `https://`.** A `http://` címet az indexelés visszautasítja, mert a
  lap https-en fut, és a böngésző a nem biztonságos képet néma módon letiltaná.
- **A távoli kép meglétét nem tudjuk ellenőrizni.** Ha a másik oldal átszervezi
  a fájljait vagy megszűnik, a kép eltűnik a cikkből, és erről nem kapsz
  jelzést. Fontos képet ezért érdemes a repóba másolni — az örökre megmarad, és
  a szerzői jogi kérdés is tisztább.

### Képleírás

Az `alt` szöveg (a `![...]` szögletes zárójelben álló rész) a látássérült
olvasóknak és a kép betöltési hibája esetén jelenik meg. Írd le, mi látszik a
képen — ne azt, hogy „kép".

A borítókép `coverAlt` mezője kettős szerepű: leírás **és** képaláírás is, a
kép alatt megjelenik.

---

## Rovat és címke

| | Rovat (`section`) | Címke (`tags`) |
| --- | --- | --- |
| Hány lehet? | pontosan egy | tetszőleges számú |
| Hol látszik? | színes címke a kártyán, saját nézet | a cikk alján, `#címke` alakban |
| Mire jó? | a lap tagolása | a kapcsolódó cikkek ajánlása |

A rovatok maguktól jönnek létre: amelyik nevet leírod a `section` mezőbe, az
megjelenik a hírfolyam tetején lévő rovatsávban, a cikkek számával együtt.
Ezért **ügyelj az egységes írásmódra** — a „Vasút" és a „vasút" két külön
rovat lesz.

A cikk végi ajánló így válogat: azonos rovat 2 pont, minden közös címke
1 pont, és a három legtöbb pontot elérő cikk kerül ki.

---

## Kiemelés, ütemezés, hírsáv

### Vezető cikk

A hírfolyam tetején nagy méretben egy cikk áll. Ez alapesetben a legfrissebb;
a `featured: true` mezővel más cikket is odatehetsz.

**A kiemelés 14 nap után elévül**, utána a cikk visszaáll a rácsba, és megint
a legfrissebb vezet. Így egy bent felejtett jelölés nem ragasztja a nyári
hírt a lap tetejére télen. (A határ a `assets/js/config.js` fájlban,
`HIRFOLYAM.kiemelesNapok` néven állítható.)

### Ütemezés

**A jövőre datált cikk nem látszik a lapon**, és a saját napján magától
megjelenik — nem kell újra közzétenni semmit, mert a szűrés az olvasó
böngészőjében fut.

Előre megnézni a `?elonezet=1` címmel lehet:

```
http://localhost:4173/?elonezet=1
```

Ilyenkor az ütemezett cikkek is látszanak, a hírsáv viszont továbbra sem
mutatja őket.

### Hírsáv (Friss hírek)

A lapfej alatti futó szalagra magától felkerül minden cikk, amely **az elmúlt
5 napban** jelent meg, legfeljebb 10 darab. Nem kell hozzá külön mező.

Ha ebben az ablakban egy cikk sincs, a szalag nem marad üresen: a legfrissebb
5 cím kerül rá, „Korábbi hírek" felirattal.

---

## Ellenőrzés és közzététel

```bash
npm start          # jegyzék frissítése + helyi kiszolgáló
npm run index      # csak a jegyzék frissítése
npm test           # a fejléc- és leadkezelés tesztjei
```

A lap `fetch`-csel tölti be a cikkeket, ezért a `.md` fájl megnyitása
böngészőben (`file://`) nem működik — kell a helyi kiszolgáló.

Közzététel: küldd be a `main` ágra. A GitHub Actions lefuttatja a teszteket,
újraépíti a jegyzéket, és kirakja a lapot. Ha az indexelés hibát talál, a
közzététel **leáll**, és a lapon a régi állapot marad — törött cikk nem kerül ki.

---

## Hibaüzenetek

Az `npm run index` minden hibát egyszerre sorol fel, a fájl nevével.

| Üzenet | Mi a baj? | Megoldás |
| --- | --- | --- |
| `hiányzik vagy üres a kötelező "title" mező` | Nincs cím. | Írj `title:` sort a fejlécbe. |
| `nincs "date" mező, és a fájlnév sem ÉÉÉÉ-HH-NN- előtaggal kezdődik` | A dátum sehonnan nem derül ki. | Nevezd át a fájlt, vagy tegyél `date:` mezőt a fejlécbe. |
| `a dátum nem ÉÉÉÉ-HH-NN alakú` | Például `2026.08.14.` | Írd `2026-08-14` alakban. |
| `a kép nem található` | Elgépelt fájlnév vagy hiányzó fájl. | Ellenőrizd a `content/images` mappát. |
| `a képútvonal abszolút…` | `/content/images/…` | Hagyd el a kezdő `/` jelet. |
| `a képútvonal a cikkhez képest relatív…` | `../images/…` | Írd a lap gyökeréhez képest: `content/images/…` |
| `a kép http:// címen van…` | Nem biztonságos távoli kép. | Használd a `https://` változatot, vagy másold a képet a repóba. |
| `azonos slug kétszer` | Két fájl neve megegyezik. | Nevezd át az egyiket. |
| `a front matter nyitó "---" jelét nem követi lezáró "---" sor` | Elmaradt a fejléc zárása. | Tedd ki a második `---` sort. |
| `Értelmezhetetlen front matter sor` | Hiányzik a kettőspont, vagy rossz a behúzás. | Nézd meg a fenti [írásmódot](#a-fejléc-írásmódja). |

---

## Teljes példa

```markdown
---
title: "Új menetrend: óránként járnak a hétvégi vonatok"
date: 2026-08-14
section: Vasút
author: Forgalmi rovat
lead: >
  Szeptember elsejétől a hétvégi vonatok óránként közlekednek
  Széchenyihegy és Hűvösvölgy között; a hétköznapi menetrend nem változik.
cover: content/images/menetrend.svg
coverAlt: Menetrendi tábla a széchenyihegyi állomás peronján
featured: true
tags: [menetrend, forgalom, hétvége]
---

Szeptember elsejétől sűrűbben járnak a hétvégi vonatok: a korábbi
másfél órás követés helyett óránként indul szerelvény mindkét végállomásról.

## Az új időpontok

| Indulás Széchenyihegyről | Érkezés Hűvösvölgybe | Keresztezés |
| :----------------------- | :------------------- | :---------- |
| 9:00 | 9:45 | Virágvölgy |
| 10:00 | 10:45 | Szépjuhászné |

## Amire figyelj

- A **hétköznapi** menetrend nem változik.
- Az utolsó vonat 17:00-kor indul Hűvösvölgyből.
- Kerékpárt csak a hűvösvölgyi irányban lehet szállítani.

> Egyvágányú pályán minden perc számít: ha egy vonat késik, az a szemben
> jövőt is megállítja.

A részletes menetrend a [Vasút rovatban](#/rovat/Vasút) és a
[hivatalos oldalon](https://gyermekvasut.hu/menetrend/) is megtalálható.

![Az új menetrendi tábla](content/images/menetrend-tabla.svg)
```
