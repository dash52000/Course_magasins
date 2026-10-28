import type { Article } from '../lib/types.ts';
import { PROFILS } from '../lib/types.ts';
import { formaterQuantite } from '../lib/parse.ts';

interface Props {
  article: Article;
  onBasculer: () => void;
  onQuantite: (sens: 1 | -1) => void;
  onOptions: () => void;
  onSupprimer: () => void;
}

/** Poubelle dessinée en SVG pour un rendu net et identique sur iPhone et Android. */
function Poubelle() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden focusable="false">
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Ligne({ article: a, onBasculer, onQuantite, onOptions, onSupprimer }: Props) {
  const quantite = formaterQuantite(a.quantite, a.unite);
  const peutBaisser = a.unite ? (a.quantite ?? 0) > 0 : (a.quantite ?? 1) > 1;

  return (
    <li className={a.coche ? 'ligne cochee' : 'ligne'}>
      <button
        className="ligne-principal"
        onClick={onBasculer}
        aria-pressed={a.coche}
        aria-label={`${a.nom}${quantite ? ` ${quantite}` : ''}${a.coche ? ', dans le panier' : ''}`}
      >
        <span className="rond" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="bulle" aria-hidden>
          <span className="bulle-icone">{a.icone ?? '🛒'}</span>
          {a.ajoute_par && (
            <span className={`auteur auteur-bulle auteur-${a.ajoute_par}`} title={`Ajouté par ${PROFILS[a.ajoute_par].prenom}`}>
              {PROFILS[a.ajoute_par].initiale}
            </span>
          )}
        </span>
        <span className="ligne-texte">
          <span className="ligne-nom">
            {a.nom}
            {a.coche && quantite && <span className="ligne-qte-texte"> {quantite}</span>}
          </span>
          {a.note && <span className="ligne-note">{a.note}</span>}
        </span>
      </button>

      <div className="ligne-actions">
        <button className="supprimer" onClick={onSupprimer} aria-label={`Supprimer ${a.nom}`}>
          <Poubelle />
        </button>
        <button className="options" onClick={onOptions} aria-label={`Options pour ${a.nom}`}>
          …
        </button>
      </div>

      {!a.coche && (
        <div className="qte">
          <button
            className="qte-btn"
            onClick={() => onQuantite(-1)}
            disabled={!peutBaisser}
            aria-label={`Une de moins : ${a.nom}`}
          >
            −
          </button>
          <span className="qte-valeur">{quantite || '1'}</span>
          <button className="qte-btn" onClick={() => onQuantite(1)} aria-label={`Une de plus : ${a.nom}`}>
            +
          </button>
        </div>
      )}
    </li>
  );
}
