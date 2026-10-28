import { normaliser } from './normalise.ts';
import { PACK } from './pack.ts';

/** Mots-clés → emoji, en plus du pack de démarrage. Clés déjà normalisées. */
const MOTS: Record<string, string> = {
  baguette: '🥖', croissant: '🥐', brioche: '🍞', pain: '🥖',
  fromage: '🧀', emmental: '🧀', comte: '🧀', mozzarella: '🧀', raclette: '🧀', gruyere: '🧀',
  yaourt: '🥣', creme: '🥛', lait: '🥛', oeuf: '🥚', beurre: '🧈',
  saumon: '🐟', thon: '🐟', crevette: '🦐', poisson: '🐟',
  steak: '🥩', boeuf: '🥩', porc: '🥩', viande: '🥩', poulet: '🍗', dinde: '🍗',
  lardon: '🥓', jambon: '🥓', saucisse: '🌭', saucisson: '🥓',
  fraise: '🍓', raisin: '🍇', poire: '🍐', peche: '🍑', cerise: '🍒', ananas: '🍍', kiwi: '🥝',
  melon: '🍈', pasteque: '🍉', mangue: '🥭', pomme: '🍎', banane: '🍌', citron: '🍋', orange: '🍊',
  avocat: '🥑', brocoli: '🥦', concombre: '🥒', courgette: '🥒', mai: '🌽', aubergine: '🍆',
  piment: '🌶️', poivron: '🫑', carotte: '🥕', tomate: '🍅', salade: '🥬', epinard: '🥬',
  oignon: '🧅', ail: '🧄', champignon: '🍄', patate: '🥔', haricot: '🫘', lentille: '🫘',
  pate: '🍝', spaghetti: '🍝', riz: '🍚', farine: '🌾', semoule: '🌾',
  miel: '🍯', confiture: '🍯', chocolat: '🍫', biscuit: '🍪', gateau: '🍰', glace: '🍨',
  pizza: '🍕', chip: '🥔', noix: '🥜', cacahuete: '🥜', cafe: '☕', the: '🍵',
  eau: '💧', jus: '🧃', sirop: '🧃', soda: '🥤', coca: '🥤', limonade: '🥤',
  biere: '🍺', vin: '🍷', champagne: '🍾',
  sel: '🧂', poivre: '🧂', huile: '🫒', vinaigre: '🍶', moutarde: '🌭', ketchup: '🍅', mayonnaise: '🥚',
  savon: '🧼', shampoing: '🧴', gel: '🧴', dentifrice: '🪥', brosse: '🪥',
  eponge: '🧽', vaisselle: '🧽', lessive: '🧺', papier: '🧻', essuie: '🧻', mouchoir: '🧻',
  pile: '🔋', ampoule: '💡', poubelle: '🗑️', croquette: '🐾', litiere: '🐾',
};

const PACK_NORM = PACK.map(([nom, icone]) => [normaliser(nom), icone] as const);

/** Devine un emoji pour un nouveau produit à partir de son nom. */
export function devinerIcone(nom: string): string {
  const n = normaliser(nom);
  const exact = PACK_NORM.find(([p]) => p === n);
  if (exact) return exact[1];
  for (const mot of n.split(' ')) {
    if (MOTS[mot]) return MOTS[mot];
  }
  const partiel = PACK_NORM.find(([p]) => n.includes(p));
  return partiel ? partiel[1] : '🛒';
}
