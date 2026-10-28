const PHRASES = [
  (n: number) => `Courses terminées : ${n} article${n > 1 ? 's' : ''} au panier. Bien joué !`,
  (n: number) => `${n} article${n > 1 ? 's' : ''} rapporté${n > 1 ? 's' : ''}. Le frigo dit merci.`,
  (n: number) => `Mission accomplie : ${n} article${n > 1 ? 's' : ''}, zéro oubli.`,
  (n: number) => `C'est rangé ! ${n} article${n > 1 ? 's' : ''} dans l'historique.`,
  (n: number) => `${n} sur ${n}. Liste vaincue.`,
];

let derniere = -1;

/** Une phrase de fin de courses, jamais deux fois de suite la même. */
export function phraseDeFin(n: number): string {
  let i = Math.floor(Math.random() * PHRASES.length);
  if (i === derniere) i = (i + 1) % PHRASES.length;
  derniere = i;
  return PHRASES[i](n);
}
