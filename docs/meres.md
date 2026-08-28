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

> A menüpontok a magyar felület nevén szerepelnek, zárójelben az angol
> megfelelővel – a Google időnként átnevezi őket.

Az események maguktól megjelennek (**Jelentések → Elköteleződés → Események**,
Reports → Engagement → Events; a **Valós idejű** nézetben azonnal), a
**paramétereik viszont csak akkor**, ha felvesszük őket egyedi
meghatározásként. Ez az egyszeri teendő:

1. Bal alul **Adminisztrátor** (Admin).
2. **Adatmegjelenítés** (Data display) → **Egyéni meghatározások**
   (Custom definitions).
3. **Egyéni dimenziók** (Custom dimensions) fül → **Egyéni dimenzió
   létrehozása** gomb. Öt dimenzió kell, mindegyiknél a **Hatókör** (Scope)
   maradjon **Esemény** (Event), az **Eseményparaméter** (Event parameter)
   mezőbe pedig pontosan a lenti nevet írd – kisbetűvel, ékezet nélkül:

   | Dimenzió neve (szabadon választható) | Eseményparaméter |
   | --- | --- |
   | Cikk címe | `cikk_cim` |
   | Cikk azonosítója | `cikk_slug` |
   | Rovat | `rovat` |
   | Honnan érkezett | `honnan` |
   | Téma | `tema` |

4. **Egyéni mutatók** (Custom metrics) fül → **Egyéni mutató létrehozása**.
   Négy mutató, szintén **Esemény** hatókörrel; a **Mértékegység**
   (Unit of measurement) a másodperceknél `Másodperc` (Seconds), a többinél
   `Szabvány` (Standard):

   | Mutató neve | Eseményparaméter | Mértékegység |
   | --- | --- | --- |
   | Olvasás ideje | `masodperc` | Másodperc |
   | Látszó cikkek | `latszik` | Szabvány |
   | Új cikkek száma | `uj_cikk` | Szabvány |
   | Módosult cikkek száma | `valtozott` | Szabvány |

A felvétel után a **jelentésekben csak az azutáni adat** jelenik meg (a valós
idejű nézet és a **Hibakeresési nézet** / DebugView azonnal mutatja), és a
szokásos GA4-késés miatt a napi jelentésekben ~24 óra múlva látszik minden.
Az ingyenes GA4-ben 50 egyéni dimenzió és 50 mutató fér el; ebből ez a lap
ötöt és négyet használ.

Ha valamelyik esemény fontos célnak számít – például a `cikk_vegigolvasva` –,
az **Adminisztrátor → Események** alatt megjelölhető **kulcseseményként**
(key event).

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
