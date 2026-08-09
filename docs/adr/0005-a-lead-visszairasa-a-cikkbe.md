# Az indexelő visszaírja a leadet a cikkbe

A `npm run index` nem csak olvassa a `content/cikkek` mappát: ha egy cikkből
hiányzik a `lead`, az első bekezdésből készít egyet, és a leadet – a kézzel
írtat is – kiegyenlített sorokra tördelve visszaírja a `.md` fájl fejlécébe.
Egy építési lépés, amely a forrásfájlokat módosítja, szokatlan, ezért érdemes
rögzíteni, hogy ez szándékos.

## Miért így

Az alternatíva az volt, hogy a származtatott lead csak a jegyzékbe kerül, a
cikk fájlja érintetlen marad. Elvetettük: így a szerkesztő nem látja a
fájlban, mi jelenik meg a kártyáján, és nem tudja egyetlen szó átírásával
javítani — a lead egy láthatatlan, máshol tárolt adat lenne. A visszaírással a
`.md` fájl marad az egyetlen igazságforrás, a generált szöveg pedig ugyanolyan
szerkeszthető, mintha kézzel írták volna.

## Consequences

- A művelet idempotens: a második futás már nem módosít semmit, így nem
  keletkezik felesleges változás a verziókövetésben.
- A GitHub Actions futtatásakor a módosítás csak a build munkapéldányát
  érinti, visszacommitolás nincs — a tördelés a szerkesztő gépén, a beküldés
  előtt véglegesül.
- A `|` blokkot is `>` alakúra normalizáljuk: a lead egyetlen bekezdés, a
  benne lévő kézi sortörés a megjelenítésben úgysem látszana.
