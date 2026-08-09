# A cikkjegyzéket építési időben állítjuk elő

A követelmény szerint a lap minden kódja kliensoldali JavaScript, csakhogy a
GitHub Pages nem listáz könyvtárat: a böngésző önmagában sosem tudná meg,
milyen `.md` fájlok vannak a repóban. Ezért a `tools/build-index.mjs` Node-szkript
a közzététel előtt végigolvassa a `content/cikkek` mappát, és `content/index.json`
néven leteszi a fejlécek jegyzékét — a **kiszolgált lap** így továbbra is csupa
statikus fájl, a futó kódja pedig továbbra is kizárólag kliensoldali.

## Miért nem kézzel írt jegyzék

Az alternatíva egy kézzel karbantartott `index.json` volt, ami valóban minden
építési lépést kiiktatott volna. Elvetettük: egy új cikk így két fájl
összehangolt szerkesztését igényelné, és az elfelejtett jegyzékbejegyzés
csendben eltüntetne egy cikket. A mostani menettel a szerkesztő dolga annyi,
hogy beküld egy Markdown fájlt; a jegyzéket a GitHub Actions frissíti.

## Következmény

A repó klónozása után helyben egyszer le kell futtatni az `npm run index`
parancsot (az `npm start` ezt magától megteszi), különben a lap a legutóbb
beküldött jegyzéket látja.
