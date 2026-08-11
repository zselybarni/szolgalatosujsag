# 9. Szolgálatos Újság

A 9. Szolgálatos Csoport statikus online lapja a Széchenyi-hegyi
Gyermekvasútról. A szerkesztő Markdown fájlokat ír, az olvasó egy újságoldalt
lát – köztük nincs szerver.

## Nyelv

### A lap részei

**Lapfej**:
A lap tetején futó sáv: az időjárás-jelző, a lap neve és a témaváltó.
_Kerülendő_: fejléc, header, masthead.

**Hírsáv**:
A lapfej alatti futó szalag a legfrissebb címekkel. Az olvasó felé "Friss
hírek" néven jelenik meg.
_Kerülendő_: ticker, futósáv, hírszalag.

**Hírfolyam**:
A cikkek fordított időrendű listája a lapfej alatt: egy vezető cikk és az
alatta lévő cikkrács. A lap neve ettől független, azt a `LAP.nev` adja.
_Kerülendő_: feed, hírlista, főoldal.

**Vezető cikk**:
A hírfolyam tetején nagy méretben megjelenő cikk. A `featured` fejlécmezővel
jelölt cikk, ilyen hiányában a legfrissebb.
_Kerülendő_: kiemelt hír, lead cikk, hero.

### A tartalom

**Cikk**:
Egy `content/cikkek` mappában lévő Markdown fájl: fejléc (front matter) és
törzs. A fájlnév adja az azonosítóját.
_Kerülendő_: bejegyzés, poszt, hír, oldal.

**Fejléc**:
A cikk elején `---` sorok közé zárt mezők: cím, dátum, rovat, borítókép.
_Kerülendő_: metaadat, front matter, YAML.

**Lead**:
A cikk egy bekezdésnyi ajánlója, amely a kártyán és a cikk élén is megjelenik.
Ha a szerkesztő nem írja meg, az első bekezdésből készül.
_Kerülendő_: bevezető, felvezető, kivonat, összefoglaló.

**Szerkesztő**:
A `szerkeszto.html` lap, amin a cikk összeállítható: űrlap a fejlécnek,
Markdown-szerkesztő a szövegnek, és előnézet. A kész fájlt kiadja, de a repóba
nem írja – lásd [0006](docs/adr/0006-szerkeszto-nem-ir-a-repoba.md).
_Kerülendő_: admin, CMS, backend, felület.

**Piszkozat**:
A szerkesztőben éppen összeállított, még be nem küldött cikk. A böngésző
tárolójában él, újratöltés után folytatható.
_Kerülendő_: vázlat, draft, munkapéldány.

**Ütemezett cikk**:
Jövőbeli dátumú cikk. A lapon nem látszik, a saját napján magától megjelenik.
_Kerülendő_: piszkozat, vázlat, rejtett cikk.

**Rovat**:
Egy cikk egyetlen témabesorolása (`section` mező), például Vasút vagy Tábor.
Külön nézete van. Egy cikknek pontosan egy rovata lehet.
_Kerülendő_: kategória, csoport.

**Címke**:
Egy cikk több szabad kulcsszava (`tags` mező). A rovattal ellentétben nincs
saját nézete, csak az ajánló használja.
_Kerülendő_: tag, kulcsszó.

**Cikkjegyzék**:
A `content/index.json`, amely minden cikk fejlécadatát felsorolja. Ebből tudja
a böngésző, milyen cikkek léteznek; a Markdown törzs csak megnyitáskor töltődik le.
_Kerülendő_: manifest, adatbázis, index.

### A vasút

**Állomás**:
A Gyermekvasút jelenleg üzemelő megállási helye Széchenyihegy és Hűvösvölgy
között. A megszűnt megállók nem tartoznak ide.
_Kerülendő_: megálló, stáció.

**Tábor**:
A hűvösvölgyi Gyermekvasutas Otthon és Tábor. Ennek az időjárását mutatja a
lapfejben ülő jelző; az állomásoké csak a felnyíló ablakban látszik.
_Kerülendő_: otthon, bázis, központ.
