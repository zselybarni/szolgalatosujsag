# A szerkesztő nem ír a repóba

A `szerkeszto.html` összeállítja a kész `.md` fájlt, de nem menti el: letölthető,
vágólapra másolható, illetve egy előre kitöltött GitHub-űrlapon beküldhető. A
commitot ember csinálja.

## Miért nem ír közvetlenül

Kézenfekvő lett volna a GitHub API-val commitolni, de ahhoz a böngészőben kell
lennie egy írási jogú tokennek. A lap statikus és nyilvános, tehát a token csak
az olvasó gépén, a `localStorage`-ban élhetne – megosztott vagy közös
számítógépen ez a repó írási kulcsának kiszórása. A letöltés és a
vágólap ehhez képest semmilyen jogosultságot nem igényel, telefonról is
működik, és a beküldés így is egyetlen lépés a GitHub felületén.

Ha egyszer mégis kell az egykattintásos közzététel, a helyes irány nem a
böngészőbe rejtett token, hanem egy külön, hitelesített kis kiszolgáló – az
viszont már nem statikus lap.

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
