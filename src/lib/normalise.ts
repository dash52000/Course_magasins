/**
 * Normalise un nom de produit pour comparer « Tomates », « tomate » et « TOMATE ».
 * Minuscules, sans accents, œ → oe, espaces réduits, pluriel simple retiré
 * (s ou x final sur les mots de plus de 3 lettres, sauf « ss »).
 *
 * Utilisée à la fois par l'app et par le script qui génère le pack de démarrage :
 * les deux doivent produire exactement la même clé.
 */
export function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((mot) => (mot.length > 3 && /[sx]$/.test(mot) && !/ss$/.test(mot) ? mot.slice(0, -1) : mot))
    .join(' ');
}
