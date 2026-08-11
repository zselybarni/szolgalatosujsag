# A szerkesztő alapesetben nem ír a repóba

A `szerkeszto.html` összeállítja a kész `.md` fájlt, de alapesetben nem menti
el: letölthető, vágólapra másolható, illetve egy előre kitöltött GitHub-űrlapon
beküldhető. A commitot ember csinálja. (A tokenes kivételről lásd a lap alján
lévő frissítést.)

## Miért nem ír közvetlenül

Kézenfekvő lett volna a GitHub API-val commitolni, de ahhoz a böngészőben kell
lennie egy írási jogú tokennek. A lap statikus és nyilvános, tehát a token csak
az olvasó gépén, a `localStorage`-ban élhetne – megosztott vagy közös
számítógépen ez a repó írási kulcsának kiszórása. A letöltés és a
vágólap ehhez képest semmilyen jogosultságot nem igényel, telefonról is
működik, és a beküldés így is egyetlen lépés a GitHub felületén.

## Frissítés: a tokenes út mégis bekerült, választhatóan

A szerkesztő kapott egy **külön nyitható** „Közzététel egy kattintással"
szakaszt, amiben megadható egy írási jogú token, és onnantól a szerkesztő maga
küldi be a cikket és a behúzott képeket a Contents API-n.

Ez nem vonja vissza a fentieket: a letöltés maradt az alapértelmezett és
javasolt út, a tokenes csak egy tudatosan felnyitott lehetőség. A fenti
kockázatot a tárolás módja szorítja a lehető legkisebbre:

- a token **nem része a piszkozatnak**, ezért a mentésbe sem kerül bele;
- alapesetben csak a memóriában van, újratöltéskor elveszik;
- kérésre `sessionStorage`-ba megy, ami a lap bezárásakor törlődik –
  `localStorage`-ba szándékosan nem, mert az ott maradna a gépen;
- csak `Authorization` fejlécben utazik, címben soha, és a „Token törlése"
  gomb azonnal kiüríti mindkét helyről.

A javasolt token finomhangolt (fine-grained), egyetlen repóra szűkítve, és
csak `Contents: Read and write` joggal – így akkor sem nyílik semmi más, ha
mégis kiszivárog. Az igazán biztonságos megoldás továbbra is egy külön,
hitelesített kiszolgáló volna, az viszont már nem statikus lap.

## Következmény

- A szerkesztő bármikor közzétehető: nyilvánosan is legfeljebb szöveget gyárt,
  írni nem tud. Ezért nincs rajta jelszó sem; a `szerkeszto.html` nincs a lapról
  kiemelten hivatkozva, de nem titok, és egy kliensoldali jelszóellenőrzés
  a forrásból kiolvasható lenne.
- A hosszú cikk nem fér el a GitHub-űrlap címsorában (kb. 6000 jel fölött), erre
  a szerkesztő figyelmeztet, és a vágólapos utat ajánlja.
- A képek feltöltése ugyanezért marad kézi, de van egy külön ok is: a cikk
  szövege elmegy a cím sorában, egy **fájl** viszont nem. A GitHub feltöltőlapja
  fájlválasztót használ, és azt a böngésző más oldal kódjából nem engedi
  kitölteni – ez szándékos védelem, nem hiányosság. A szerkesztő ezért a
  feltöltőlapot nyitja meg a jó mappára, a képet pedig addig a helyi fájlból
  mutatja az előnézetben.
