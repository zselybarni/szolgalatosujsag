# Mérés: mit tudunk meg az olvasókról

A lap a látogatások számán túl néhány saját eseményt is küld a Google
Analyticsbe. Mindegyik egy kérdésre válaszol, amit a puszta oldalletöltés-szám
nem árul el: melyik cikket **olvassák** (nem csak megnyitják), a lap melyik
része viszi őket a cikkekhez, és használják-e egyáltalán az időjárás-jelzőt.

A mérőkódot az `index.html` tölti be (lásd a
[0009-es ADR-t](adr/0009-latogatottsagmeres-google-analytics.md)), az események
egyetlen modulból mennek: `assets/js/meres.js`. A szerkesztőn nincs mérés.

## Az események

| Esemény | Paraméterek | Mire válaszol |
| --- | --- | --- |
| `cikk_megnyitas` | `cikk_cim`, `cikk_slug`, `rovat`, `honnan` | Melyik cikket nyitják meg, és honnan jutnak oda |
| `cikk_vegigolvasva` | `cikk_cim`, `cikk_slug`, `masodperc` | Melyik cikket olvassák a végéig, és mennyi idő alatt |
| `rovat_valtas` | `rovat` | Melyik rovat érdekli az olvasókat |
| `tovabbiak` | `latszik` | Elmennek-e az első képernyőnél tovább |
| `idojaras_megnyitas` | – | Használják-e a lap saját időjárás-jelzőjét |
| `tema_valtas` | `tema` | Váltanak-e sötét módra |
| `frissites_ajanlat` | `uj_cikk`, `valtozott` | Milyen gyakran van mit ajánlani a nyitva hagyott lapon |
| `frissites_elfogadva` | – | Kattint-e valaki a frissítési ajánlatra |

A `honnan` értékei: `vezeto` (a vezető cikk), `kartya` (a cikkrács),
`hirsav` (a futó szalag), `ajanlo` (a cikk végi „Olvasd el ezt is”),
`kozvetlen` (beírt vagy megosztott cím), `egyeb`.

### Amit ebből érdemes nézni

- **`cikk_megnyitas` / `cikk_vegigolvasva` arány cikkenként.** Ez a lap
  legérdekesebb száma: a megnyitás még nem olvasás.
- **`honnan` megoszlása.** Ha a `hirsav` visz sok olvasót, érdemes gondozni;
  ha alig, akkor a hírfolyam eleje a fontos.
- **`idojaras_megnyitas` a látogatásokhoz képest.** A lap egyik jellegzetes
  szolgáltatása – vagy senkinek sem kell.

## Egyszeri teendő a GA4-ben

Az események maguktól megjelennek (Reports → Engagement → Events, illetve
azonnal a Realtime nézetben), a **paramétereik viszont csak akkor**, ha
felvesszük őket egyedi meghatározásként. Admin → Data display → Custom
definitions:

**Custom dimensions** (Scope: *Event*, az „Event parameter” mezőbe pontosan ezt
a nevet írd):

| Dimension name | Event parameter |
| --- | --- |
| Cikk címe | `cikk_cim` |
| Cikk azonosítója | `cikk_slug` |
| Rovat | `rovat` |
| Honnan érkezett | `honnan` |
| Téma | `tema` |

**Custom metrics** (Scope: *Event*):

| Metric name | Event parameter | Unit |
| --- | --- | --- |
| Olvasás ideje | `masodperc` | Seconds |
| Látszó cikkek | `latszik` | Standard |
| Új cikkek száma | `uj_cikk` | Standard |
| Módosult cikkek száma | `valtozott` | Standard |

A felvétel után a **jelentésekben csak az azutáni adat** jelenik meg (a
Realtime és a DebugView azonnal mutatja), és a szokásos GA4-késés miatt a
napi jelentésekben ~24 óra múlva látszik minden.

Ha valamelyik esemény fontos célnak számít – például a `cikk_vegigolvasva` –,
az Admin → Events alatt megjelölhető **key eventként**.

## Amit érdemes tudni a számokról

- **A reklámblokkolók a mérőkódot is kiszűrik**, tehát minden szám alsó becslés.
- **A rövid cikknél a `cikk_vegigolvasva` azonnal megérkezik**, mert a szöveg
  vége görgetés nélkül is a képernyőn van. Ezért küldjük a `masodperc`
  paramétert: abból derül ki, olvasták-e vagy csak villantották.
- **A lapmegtekintéseket nem mi küldjük**, azt a GA4 saját „enhanced
  measurement”-je intézi. A `#` mögötti útvonalváltásoknál a cím (`page_title`)
  könnyen a *korábbi* oldalé marad, mert az előzményváltás hamarabb történik,
  mint a nézet kirajzolása. A cikkek szerinti bontáshoz ezért a
  `cikk_megnyitas` esemény a megbízható forrás, nem a „Pages and screens”
  jelentés.
- **A mérés sosem ronthatja el a lapot**: ha a `gtag` nincs ott vagy hibázik, az
  események csendben elmaradnak.
