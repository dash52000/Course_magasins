/** Un article tel que tapé dans le champ d'ajout rapide. */
export interface Saisie {
  nom: string;
  quantite: number | null;
  unite: string | null;
}

const UNITES: Record<string, string> = {
  g: 'g',
  gr: 'g',
  kg: 'kg',
  l: 'L',
  cl: 'cL',
  ml: 'mL',
};

const NOMBRE = '(\\d+(?:[.,]\\d+)?)';
const UNITE = '(kg|gr|g|cl|ml|l)';

function nombre(s: string): number {
  return Number(s.replace(',', '.'));
}

function majuscule(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function nettoyerNom(s: string): string {
  return s
    .replace(/^(de |d'|d’|du |des )/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Découpe une saisie multi-articles en morceaux (virgule, point-virgule, retour à la ligne, « et »).
 * Une virgule entre deux chiffres (« 1,5 kg ») est une décimale, pas un séparateur.
 */
export function decouper(texte: string): string[] {
  return texte
    .split(/(?<!\d),|,(?!\d)|[;\n]|\s+et\s+/i)
    .map((m) => m.trim())
    .filter(Boolean);
}

/** Analyse un morceau : « 2 lait », « 500g farine », « 1 kg de pommes », « lait x2 ». */
export function analyserMorceau(morceau: string): Saisie | null {
  const m = morceau.trim();
  if (!m) return null;

  // Quantité (et unité) en tête : « 2 lait », « 500g farine », « 1,5 kg de pommes »
  let r = new RegExp(`^${NOMBRE}\\s*${UNITE}?\\.?\\s+(.+)$`, 'i').exec(m);
  if (r) {
    const nom = nettoyerNom(r[3]);
    if (nom) {
      return {
        nom: majuscule(nom),
        quantite: nombre(r[1]),
        unite: r[2] ? UNITES[r[2].toLowerCase()] : null,
      };
    }
  }

  // Multiplicateur en fin : « lait x2 », « lait ×2 »
  r = new RegExp(`^(.+?)\\s*[x×]\\s*${NOMBRE}$`, 'i').exec(m);
  if (r) {
    return { nom: majuscule(nettoyerNom(r[1])), quantite: nombre(r[2]), unite: null };
  }

  // Quantité avec unité en fin : « farine 500g », « lait 2 l »
  r = new RegExp(`^(.+?)\\s+${NOMBRE}\\s*${UNITE}$`, 'i').exec(m);
  if (r) {
    return { nom: majuscule(nettoyerNom(r[1])), quantite: nombre(r[2]), unite: UNITES[r[3].toLowerCase()] };
  }

  const nom = nettoyerNom(m);
  return nom ? { nom: majuscule(nom), quantite: null, unite: null } : null;
}

export function analyser(texte: string): Saisie[] {
  return decouper(texte)
    .map(analyserMorceau)
    .filter((s): s is Saisie => s !== null);
}

/** Affichage compact d'une quantité : « ×2 », « 500 g », « 1,5 kg ». */
export function formaterQuantite(quantite: number | null, unite: string | null): string {
  if (quantite === null || quantite === undefined) return '';
  const q = String(Math.round(quantite * 100) / 100).replace('.', ',');
  if (unite) return `${q} ${unite}`;
  return quantite === 1 ? '' : `×${q}`;
}
