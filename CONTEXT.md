# Hírfolyam

A Széchenyi-hegyi Gyermekvasút statikus online lapja. A szerkesztő Markdown
fájlokat ír, az olvasó egy újságoldalt lát – köztük nincs szerver.

## Nyelv

### A lap részei

**Lapfej**:
A lap tetején futó sáv: az időjárás-jelző, a lap neve és a témaváltó.
_Kerülendő_: fejléc, header, masthead.

**Hírsáv**:
A lapfej alatti futó szalag a legfrissebb címekkel. Az olvasó felé "Friss
címek" néven jelenik meg.
_Kerülendő_: ticker, futósáv, hírszalag.

**Hírfolyam**:
A cikkek fordított időrendű listája a lapfej alatt: egy vezető cikk és az
alatta lévő cikkrács. Egyben a lap neve is.
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
