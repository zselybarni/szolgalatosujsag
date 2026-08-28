# Látogatottságmérés: Google Analytics az olvasói lapon

Az `index.html` fejlécébe bekerült a Google Analytics 4 mérőkódja
(`gtag.js`, `G-2MTL4N72TR`). Eddig a lap egyetlen külső kérése az időjárás volt
– a Markdown-értelmezőt is [bemásoltuk](0003-bemasolt-markdown-ertelmezo.md),
hogy ne függjünk mástól –, ezért érdemes rögzíteni, mit vállalunk vele.

## Miért

Enélkül semmit nem tudunk arról, olvassa-e valaki a lapot: hány olvasó jár
erre, melyik cikket nyitják meg, honnan érkeznek. Egy statikus, kiszolgáló
nélküli lapnál nincs naplófájl, amiből ez utólag kiderülne — vagy mérünk a
böngészőből, vagy nem tudjuk meg.

## Amit vállalunk

- **Egy külső, `async` szkript.** Ha az olvasónál nem tölt be – blokkoló,
  hálózati hiba, lassú kapcsolat –, a lap ugyanúgy működik: a mérőkód semmit
  nem rajzol, és semmit nem vár meg. Ez a próbája is: a lap kifelé zárt gépen
  is hibátlanul felépül.
- **Csak az olvasói lap.** A `szerkeszto.html` szándékosan kimarad: az
  belső eszköz (`noindex`), a szerkesztő saját kattintásai csak zajt vinnének a
  számokba.
- **Sütik és hozzájárulás.** A GA4 sütit tesz le, és személyes adatot is
  továbbít a Google felé; az EU-ban ehhez főszabály szerint az olvasó
  hozzájárulása kell, a lapon viszont most nincs sütisáv. Ezt a lap
  tulajdonosának kell eldöntenie: hozzájárulás-kezelő sáv, vagy a mérés
  visszavétele. Az ADR ezt nyitott kérdésként rögzíti, nem eldöntöttként.

## Következmény

- **A számok alsó becslések.** A reklámblokkolók a mérőkódot is kiszűrik, tehát
  a valós olvasottság a mértnél magasabb.
- **A `#` mögötti útvonalakat ellenőrizni kell.** A lap egyetlen HTML-fájl,
  a cikkek a hash mögött élnek (lásd a [0002-es ADR-t](0002-hash-alapu-utvalasztas.md)).
  A GA4 „enhanced measurement” a böngésző előzményváltásait is lapmegtekintésnek
  számolja, tehát a cikkeknek külön meg kell jelenniük a jelentésben. Ha mégsem
  így lenne, a `hashchange`-re kézzel kell `page_view` eseményt küldeni.
- **A mérőazonosító a forrásban van**, ahogy minden más is ezen a lapon. Ez nem
  titok: legfeljebb más lapról is küldhetne valaki adatot ebbe a tulajdonba,
  amit a GA4 oldalán lehet szűrni.
