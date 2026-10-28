import { useMemo, useRef, useState } from 'react';
import type { Foyer, Fusion } from '../lib/useFoyer.ts';
import { analyser, analyserMorceau, decouper } from '../lib/parse.ts';
import { normaliser } from '../lib/normalise.ts';
import type { Produit } from '../lib/types.ts';
import type { Message } from './Bandeau.tsx';

interface Props {
  foyer: Foyer;
  onFusions: (f: Fusion[]) => void;
  informer: (m: Message) => void;
}

/** Ce qui suit le dernier séparateur : c'est le morceau en cours de frappe. */
function morceauEnCours(texte: string): string {
  const morceaux = decouper(texte);
  const fini = /[,;\n]\s*$|\s+et\s+$/i.test(texte);
  return fini ? '' : morceaux[morceaux.length - 1] ?? '';
}

export function AjoutRapide({ foyer, onFusions, informer }: Props) {
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  const suggestions = useMemo<Produit[]>(() => {
    const enCours = analyserMorceau(morceauEnCours(texte));
    const cle = enCours ? normaliser(enCours.nom) : '';
    if (cle.length < 2) return [];
    const dejaDansLaListe = new Set(foyer.articles.filter((a) => !a.coche).map((a) => a.produit_id));
    return foyer.produits
      .filter((p) => !p.masque && !dejaDansLaListe.has(p.id) && p.nom_normalise.includes(cle) && p.nom_normalise !== cle)
      .sort((a, b) => {
        const debutA = a.nom_normalise.startsWith(cle) ? 0 : 1;
        const debutB = b.nom_normalise.startsWith(cle) ? 0 : 1;
        return debutA - debutB || b.nb_achats - a.nb_achats || a.nom.localeCompare(b.nom);
      })
      .slice(0, 4);
  }, [texte, foyer.produits, foyer.articles]);

  const envoyer = async (valeur: string) => {
    const saisies = analyser(valeur);
    if (!saisies.length || envoi) return;
    setEnvoi(true);
    setTexte('');
    try {
      const fusions = await foyer.ajouter(saisies);
      onFusions(fusions);
    } catch {
      setTexte(valeur);
      informer({ texte: "L'ajout n'est pas passé. Vérifie le réseau et réessaie." });
    } finally {
      setEnvoi(false);
      champ.current?.focus();
    }
  };

  const choisirSuggestion = (p: Produit) => {
    foyer.noter('autocompletion');
    const enCours = analyserMorceau(morceauEnCours(texte));
    const morceaux = decouper(texte);
    morceaux.pop();
    const prefixe = enCours?.quantite ? `${String(enCours.quantite).replace('.', ',')}${enCours.unite ? enCours.unite : ''} ` : '';
    morceaux.push(prefixe + p.nom);
    void envoyer(morceaux.join(', '));
  };

  return (
    <div className="ajout">
      {suggestions.length > 0 && (
        <div className="suggestions" aria-label="Suggestions">
          {suggestions.map((p) => (
            <button key={p.id} className="suggestion" onClick={() => choisirSuggestion(p)}>
              <span aria-hidden>{p.icone}</span> {p.nom}
            </button>
          ))}
        </div>
      )}
      <form
        className="ajout-form"
        onSubmit={(e) => {
          e.preventDefault();
          foyer.noter('ajout_rapide');
          void envoyer(texte);
        }}
      >
        <input
          ref={champ}
          className="ajout-champ"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="2 lait, pain, 500g farine…"
          aria-label="Ajouter à la liste"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
        />
        <button className="ajout-btn" type="submit" disabled={!texte.trim() || envoi} aria-label="Ajouter">
          +
        </button>
      </form>
    </div>
  );
}
