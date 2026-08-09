# Hash-alapú útválasztás

A cikkek címe `#/cikk/<slug>` alakú, nem `/cikk/<slug>/`. A lap GitHub Pages
projektoldalként fut (`zselybarni.github.io/szolgalatosujsag/`), ahol nincs
szerveroldali átirányítás, és az alkönyvtár bármikor változhat. A `#` mögötti
útvonalat a böngésző sosem küldi el a szervernek, így a mély hivatkozás
frissítés után és tetszőleges alkönyvtárban is működik, konfiguráció nélkül.

## Considered Options

- **`404.html`-es SPA-trükk valódi útvonalakkal**: szebb címek, cserébe minden
  mély hivatkozás egy 404-es válaszon keresztül töltődik be, és a keresők is
  annak látják.
- **Cikkenként egy generált `.html`**: ez valódi oldalakat és működő
  közösségimédia-előnézetet adna, viszont ellentmond annak a kikötésnek, hogy a
  lapokat a kliens állítja össze Markdownból.

## Consequences

A cikkeknek nincs saját `<meta>` fejlécük, ezért a linkmegosztás előnézete
minden cikknél a lap általános leírását mutatja. Ha ez később fontossá válik,
az a cikkenkénti HTML-előállítás felé mozdítja a projektet.
