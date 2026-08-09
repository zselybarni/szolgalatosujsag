# Magyar azonosítók a kódban, angol mezőnevek a cikkfejlécben

A JavaScript-modulok magyarul beszélnek (`hirsavKirajzol`, `allomasok`,
`frontmatterBont`), mert a kód fogalmai a lap magyar szótárából jönnek — lásd
[CONTEXT.md](../../CONTEXT.md) —, és a fordítgatás csak elmosná őket.

A cikkek fejlécmezői viszont angolok (`title`, `date`, `section`, `cover`), mert
ezek a Markdown-világ bevett nevei: bármely szerkesztő és statikus
lapgenerátor ismeri őket, így a cikkek átvihetők maradnak.

A határ tehát éles: ami a `.md` fájlok fejlécében áll, az angol; ami a
kódban, az magyar. A `tools/build-index.mjs` a jegyzékbe az angol neveket
írja tovább.
