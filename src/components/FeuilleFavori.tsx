import { useState } from 'react';
import type { Produit } from '../lib/types.ts';
import { devinerIcone } from '../lib/icones.ts';
import { RAYONS } from '../lib/emojis.ts';
import { Feuille } from './Feuille.tsx';

interface Props {
  /** Absent : création d'un nouveau favori. Présent : modification de ce produit. */
  produit?: Produit;
  /** Nom pré-rempli à la création (ex. ce qui a été tapé dans la recherche). */
  nomInitial?: string;
  onFermer: () => void;
  onValider: (nom: string, icone: string) => void;
  onRetirer?: () => void;
}

export function FeuilleFavori({ produit, nomInitial, onFermer, onValider, onRetirer }: Props) {
  const [nom, setNom] = useState(produit?.nom ?? nomInitial ?? '');
  // Tant que l'icône n'a pas été choisie à la main, elle suit le nom tapé.
  const [iconeChoisie, setIconeChoisie] = useState<string | null>(produit?.icone ?? null);
  const icone = iconeChoisie ?? (nom.trim() ? devinerIcone(nom) : '🛒');
  const valide = nom.trim().length > 0;

  return (
    <Feuille titre={produit ? 'Modifier le favori' : 'Nouveau favori'} onFermer={onFermer}>
      <form
        className="feuille-form"
        onSubmit={(e) => {
          e.preventDefault();
          const propre = nom.trim().replace(/\s+/g, ' ');
          if (valide) onValider(propre.charAt(0).toUpperCase() + propre.slice(1), icone);
        }}
      >
        <div className="favori-apercu">
          <span className="favori-apercu-icone" aria-hidden>
            {icone}
          </span>
          <input
            className="champ"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du produit"
            aria-label="Nom du produit"
            autoFocus={!produit}
            enterKeyHint="done"
            autoCapitalize="sentences"
          />
        </div>

        <p className="etiquette">Icône</p>
        <div className="choix-icones">
          {RAYONS.map((r) => (
            <div key={r.nom} className="rayon">
              <p className="rayon-nom">{r.nom}</p>
              <div className="rayon-emojis">
                {r.emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={e === icone ? 'emoji choisi' : 'emoji'}
                    onClick={() => setIconeChoisie(e)}
                    aria-label={`Icône ${e}`}
                    aria-pressed={e === icone}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-plein" type="submit" disabled={!valide}>
          {produit ? 'Enregistrer' : 'Créer le favori'}
        </button>
      </form>

      {onRetirer && (
        <button className="btn btn-danger" onClick={onRetirer}>
          Retirer des favoris
        </button>
      )}
    </Feuille>
  );
}
