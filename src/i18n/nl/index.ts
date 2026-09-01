// Catalogo olandese. Ogni modulo è tipizzato come la corrispondente slice di
// `Messages` (l'italiano è la fonte del tipo), quindi una chiave mancante o in
// più rispetto all'italiano è un errore di compilazione.
//
// Registro: informale je/jij/jouw ovunque, mai la forma di cortesia u/uw.
// Il marchio "Carta Interior" non si traduce.
//
// ⚠️ Copy da rivedere con un madrelingua prima del lancio (tono
// intimo/psicologico del funnel).

import type { Messages } from '@/i18n';

import common from './common';
import funnels from './funnels';
import quiz from './quiz';
import processing from './processing';
import teaser from './teaser';
import report from './report';
import checkout from './checkout';
import success from './success';
import reportProcessing from './reportProcessing';
import activate from './activate';
import checkoutReview from './checkoutReview';
import landing from './landing';
import landingClassica from './landingClassica';
import landingAttivazione from './landingAttivazione';
import transits from './transits';
import social from './social';
import feedback from './feedback';
import synastryCard from './synastryCard';
import coppia from './coppia';
import astrologyGuide from './astrologyGuide';
import seo from './seo';
import demo from './demo';
import legal from './legal';

const nl: Messages = {
  common,
  funnels,
  quiz,
  processing,
  teaser,
  report,
  checkout,
  success,
  reportProcessing,
  activate,
  checkoutReview,
  landing,
  landingClassica,
  landingAttivazione,
  transits,
  social,
  feedback,
  synastryCard,
  coppia,
  astrologyGuide,
  seo,
  demo,
  legal,
};

export default nl;
