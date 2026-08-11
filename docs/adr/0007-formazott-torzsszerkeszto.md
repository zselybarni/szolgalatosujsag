# A cikk törzsét formázottan szerkesztjük

A szerkesztőben a cikk szövege **azonnal formázottan** látszik: a félkövér
félkövérként, az alcím alcímként. Nem jelöléseket írunk, hanem szöveget
szerkesztünk. A fájl formátuma viszont változatlanul Markdown: minden
változásnál visszafordítjuk a tartalmat (`assets/js/szerkeszto/html-markdown.js`).

## Miért nem maradt a jelölések írása

A tervezéskor épp az ellenkezőjét javasoltuk: a projekt a `.md` fájlt tekinti
igazságforrásnak, és egy formázott felület könnyen átírja azt, amit valaki
kézzel, pontosan úgy akart. A lap írói viszont nem Markdownt akarnak írni,
hanem cikket – ez a szempont erősebbnek bizonyult, és a döntés a lapot
készítőké.

## Amivel a kockázatot kordában tartjuk

- **Körbejárási tesztek.** Minden támogatott jelölésre van eset, és a repóban
  lévő összes cikk átmegy a Markdown → HTML → Markdown körön. Nem a fájl
  bájtjait hasonlítjuk, hanem a megjelenő lapot: az olvasó felé semmi sem
  változhat.
- **A bekezdések visszatördelése** 80 jelre, ahogy a kézzel írt cikkekben is
  van. Enélkül minden megnyitott cikk egyetlen hosszú sorrá állt volna össze,
  és a verziókövetésben az egész bekezdés átírtnak látszott volna.
- **„Forrás" mód.** Egy kattintással előjön a nyers Markdown. Táblázatot, nyers
  HTML-t vagy egy elszabadult formázást ott lehet pontosan rendbe tenni –
  ez a kijárat nem díszlet, hanem a formázott szerkesztés feltétele.
- **A beillesztett tartalom megtisztítása:** csak azok a címkék maradnak,
  amiket a lap Markdownja ismer, attribútum nélkül. Enélkül egy weboldalról
  átmásolt bekezdés idegen betűtípust és színt hozott volna a cikkbe.

## Amit tudni kell róla

A böngésző szerkesztőparancsai néha érvénytelen szerkezetet adnak – a lista
beszúrása például `<p><ul>…</ul></p>`-t –, ezért a fordító minden elemnél
megnézi, van-e blokkszintű gyereke, és úgy bontja tovább. Ez nem elegancia,
hanem tapasztalat: e nélkül a beszúrt lista nyomtalanul eltűnt a Markdownból.

A lábjegyzet és a Markdown egzotikusabb sarkai továbbra sem támogatottak –
lásd [docs/cikkiras.md](../cikkiras.md).
