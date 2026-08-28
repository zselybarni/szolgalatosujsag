/** Belépési pont: téma, időjárás, hírsáv, útválasztó. */

import { arculatAlkalmaz } from './arculat.js';
import { jegyzekBetolt } from './content.js';
import { frissitesInditas } from './frissites.js';
import { meresInditas } from './meres.js';
import { utvalasztoInditas } from './router.js';
import { temaInditas } from './theme.js';
import { hirsavKirajzol } from './ticker.js';
import { idojarasInditas } from './weather-widget.js';

arculatAlkalmaz();
temaInditas();
idojarasInditas();
meresInditas();

const tarolo = document.getElementById('tartalom');
const ujraRajzol = utvalasztoInditas(tarolo);

jegyzekBetolt()
  .then(({ cikkek }) => hirsavKirajzol(cikkek))
  .catch((hiba) => console.error('A hírsáv nem tölthető be:', hiba));

// A nyitva felejtett lap magától sosem tudna új cikkről: nézzük meg a
// jegyzéket, amikor az olvasó visszatér ide.
frissitesInditas({
  ujraRajzol: (cikkek) => {
    hirsavKirajzol(cikkek);
    ujraRajzol();
  },
});
