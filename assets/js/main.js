/** Belépési pont: téma, időjárás, hírsáv, útválasztó. */

import { jegyzekBetolt } from './content.js';
import { utvalasztoInditas } from './router.js';
import { temaInditas } from './theme.js';
import { hirsavKirajzol } from './ticker.js';
import { idojarasInditas } from './weather-widget.js';

temaInditas();
idojarasInditas();

const tarolo = document.getElementById('tartalom');
utvalasztoInditas(tarolo);

jegyzekBetolt()
  .then(({ cikkek }) => hirsavKirajzol(cikkek))
  .catch((hiba) => console.error('A hírsáv nem tölthető be:', hiba));
