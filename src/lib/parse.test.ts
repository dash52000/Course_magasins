import { describe, expect, it } from 'vitest';
import { analyser, formaterQuantite } from './parse.ts';
import { normaliser } from './normalise.ts';

describe('analyser', () => {
  it("découpe l'exemple de la spec", () => {
    expect(analyser('2 lait, pain, 500g farine')).toEqual([
      { nom: 'Lait', quantite: 2, unite: null },
      { nom: 'Pain', quantite: null, unite: null },
      { nom: 'Farine', quantite: 500, unite: 'g' },
    ]);
  });

  it('gère « et », les retours à la ligne et les « de »', () => {
    expect(analyser('1 kg de pommes et beurre\n3 yaourts')).toEqual([
      { nom: 'Pommes', quantite: 1, unite: 'kg' },
      { nom: 'Beurre', quantite: null, unite: null },
      { nom: 'Yaourts', quantite: 3, unite: null },
    ]);
  });

  it('gère les multiplicateurs et unités en fin', () => {
    expect(analyser('lait x2; farine 500 g; eau 1,5 l')).toEqual([
      { nom: 'Lait', quantite: 2, unite: null },
      { nom: 'Farine', quantite: 500, unite: 'g' },
      { nom: 'Eau', quantite: 1.5, unite: 'L' },
    ]);
  });

  it("ne casse pas un nom qui contient « et » collé", () => {
    expect(analyser('betteraves')).toEqual([{ nom: 'Betteraves', quantite: null, unite: null }]);
  });

  it('ignore les morceaux vides', () => {
    expect(analyser(' , ,pain,, ')).toEqual([{ nom: 'Pain', quantite: null, unite: null }]);
  });
});

describe('normaliser', () => {
  it('rapproche casse, accents et pluriel simple', () => {
    expect(normaliser('Tomates')).toBe(normaliser('tomate'));
    expect(normaliser('Œufs')).toBe('oeuf');
    expect(normaliser('Pâtes')).toBe('pate');
    expect(normaliser('Crème  fraîche')).toBe('creme fraiche');
    expect(normaliser('riz')).toBe('riz');
    expect(normaliser('Jus')).toBe('jus');
  });
});

describe('formaterQuantite', () => {
  it('affiche des quantités compactes', () => {
    expect(formaterQuantite(null, null)).toBe('');
    expect(formaterQuantite(1, null)).toBe('');
    expect(formaterQuantite(2, null)).toBe('×2');
    expect(formaterQuantite(500, 'g')).toBe('500 g');
    expect(formaterQuantite(1.5, 'kg')).toBe('1,5 kg');
  });
});
