# A friss tartalom a böngésző gyorsítótára ellenében

A GitHub Pages maga dönti el, meddig „friss” egy fájl, és ezen statikus
tárhelyen nincs mit állítani – nincs `_headers`, nincs `.htaccess`:

| Fájl | `Cache-Control` |
| --- | --- |
| `.html`, `.json`, `.md` | `max-age=600` (10 perc) |
| `.js`, `.css`, képek | `max-age=14400` (4 óra) |

A `max-age` ablakában a böngésző **meg sem kérdezi** a kiszolgálót, hanem a
saját másolatát adja. A lap egésze ebből él: a `content/index.json` mondja meg,
milyen cikkek léteznek — ha az régi, akkor a frissen közzétett cikk az olvasó
számára nem is létezik. Nem elméleti gond: a közzététel után visszatérő olvasó
tíz percig a tegnapi lapot látta.

## A döntés

Amit a kiszolgálón nem tudunk állítani, azt a kérés oldalán állítjuk:

- **A jegyzék** (`content/index.json`, és a szerkesztőnek a `images.json`,
  `rovatok.json`) minden betöltéskor `cache: 'no-cache'` beállítással megy.
  Ez nem a gyorsítótár kikapcsolása: feltételes kérés, amire a változatlan
  fájl `304`-gyel felel, nulla bájt letöltéssel. A jegyzéknél nincs más
  fogódzó — a saját címét nem tudjuk mihez igazítani.
- **A cikkek törzsét** viszont igen: a jegyzékbe minden cikk mellé bekerül a
  `verzio`, a fájl végleges tartalmából képzett rövid ujjlenyomat, amit a
  kliens a `.md` címe után tesz (`…/cikk.md?v=6cde6d25`). Amíg a cikk nem
  változik, a böngésző nyugodtan a mentett példányt használja; módosítás után
  más a cím, tehát új a tartalom. A friss jegyzék hordozza a verziót, így a
  kettő együtt működik.

## A nyitva felejtett lap

A fenti kettő minden *betöltésnél* friss tartalmat ad, csakhogy egy nyitva
hagyott lap sosem tölt be újra: hiába friss minden kérés, ha nincs kérés. Ezért
`assets/js/frissites.js` `frissitesPercek` sűrűséggel újraolvassa a jegyzéket,
amíg a lap látszik, és akkor is, amikor újra láthatóvá válik – fülváltás,
ablakra kattintás, vissza-gomb. Csak a visszatérésre figyelni kevés volt: aki a
lapon ülve várja a saját, épp közzétett cikkét, sosem váltana fület. Egy
ellenőrzés a 304 miatt bájtban nulla, ezért lehet ilyen sűrű.

Ha változott, **szólunk, nem cserélünk**: a lap alján felbukkan a frissítési
ajánlat, és a hírfolyamot az olvasó kattintása rajzolja újra – utána a lap
tetejére ugrunk, mert a változás ott van, az olvasó viszont bárhol tarthat. Az
automatikus csere elvesző görgetési helyet, becsukódó „Továbbiak”-at és a szeme
előtt elmozduló szöveget jelentene – rosszabbat annál, mint amit megold.

Az ajánlat felirata megnevezi a módosult cikket („Frissült: A C50-eseink”),
mert egy átírt törzstől a kártyák mit sem változnak: a puszta „Frissült a lap”
után az olvasó joggal hinné, hogy a gomb nem csinált semmit.

## Miért nem másképp

- **Időbélyeg a címben** (`?t=${Date.now()}`) minden betöltésnél új címet ad,
  tehát minden cikket újra letöltet, és a CDN gyorsítótárát is használhatatlanná
  teszi. A verzió pont annyit érvénytelenít, amennyi változott.
- **`cache: 'no-store'`** a jegyzéknél is működne, de lemond a `304`-ről:
  minden betöltés letöltené a teljes jegyzéket.
- **Service worker** a fejlécek fölé kerekedne, de egy statikus lapra saját,
  jóval csúnyább elavulási osztályt hozna: a rosszul frissülő service worker
  hetekre beragasztja a régi lapot.
- **Egyedi tartomány, saját CDN-nel** meg tudná adni a fejléceket, de az már
  nem a „statikus GitHub Pages” kikötés.

## Következmény

- Új és módosított cikk azonnal látszik, amint a közzétételi folyamat lefutott;
  az olvasónak nem kell frissítenie (`Ctrl+F5`).
- Betöltésenként egy feltételes kérés a jegyzékre, és `frissitesPercek`-enként
  egy a nyitva hagyott lapon. Ez a 304 miatt bájtban nulla, időben egy
  kérésnyi.
- A jegyzék újraolvasásakor a megváltozott cikkek kirajzolt törzsét eldobjuk a
  memóriából is: a slug ugyanaz maradt, a szöveg viszont nem.
- A `verzio` a `tools/build-index.mjs` dolga, a `generalva` mezőhöz hasonlóan
  építési adat, ezért – a [0004](0004-magyar-kod-angol-fejlecmezok.md) szerint –
  magyar nevű: nem a cikk fejlécéből jön.
- **A lap saját kódja (`.js`, `.css`) a Pages fejléce szerint négy óráig
  ragadna** a visszatérő olvasónál. A cikkek megjelenését ez nem gátolja –
  azokat a friss jegyzékből szedi a kód –, egy kódváltozás viszont ennyit
  késne. Nem elméleti kellemetlenség: éppen ez keltette azt a látszatot, hogy
  a fenti javítás közzététel után sem működik (a böngésző a régi `content.js`-t
  futtatta tovább).

  A lap Cloudflare mögül szolgál ki, ezért ezt ott oldottuk meg, kód nélkül:
  egy gyorsítótár-szabály (Caching → Cache Rules) az `/assets/` és `/vendor/`
  alatt a **böngésző-TTL-t 300 másodpercre** írja felül, az él gyorsítótárát
  érintetlenül hagyva. Ellenőrizni így lehet:

  ```bash
  curl -sI https://szolgalatosujsag.hu/assets/js/content.js | grep -i cache-control
  # cache-control: max-age=300     – nem 14400
  ```

  Ha a lap egyszer Cloudflare nélkül szolgálna ki, ez a szabály elveszik, és
  visszatér a négy óra. Kódból csak verziózott eszközcímek oldanák meg, ami
  ES-modulok mellett a jegyzéképítő által írt importtérképet kívánna – ezt
  addig nem vállaltuk be, amíg egyetlen kattintásnyi beállítás megteszi.
- **A képek** neve a címük: ha egy meglévő képet más tartalommal, azonos néven
  töltünk fel, az olvasónál négy óráig a régi maradhat. Csere helyett tehát új
  fájlnevet adjunk.
