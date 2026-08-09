# A Markdown-értelmezőt bemásoljuk, tisztítót nem használunk

A `marked` egy rögzített változata a `vendor/` mappában él, nem CDN-ről töltjük.
Így a lap külső kiszolgáló elérhetőségétől és verzióváltásától függetlenül
ugyanazt jeleníti meg, offline is működik, és nem kerül harmadik fél kódja a
látogatók böngészőjébe. Cserébe a frissítés kézi munka: a fájlt cserélni kell.

## Miért nincs HTML-tisztító (DOMPurify)

A cikkek forrása maga a repó, tehát az tud HTML-t beszúrni a Markdownba, aki a
lap JavaScript-fájljait is át tudja írni — ellene a tisztító nem véd. Ezért a
plusz ~45 KB nem vásárol valódi biztonságot, és kihagytuk.

**Ez a döntés megfordul**, ha a cikkek forrása valaha kikerül a repóból: külső
beküldés, kommentek vagy bármilyen olvasói tartalom esetén tisztító kell.
