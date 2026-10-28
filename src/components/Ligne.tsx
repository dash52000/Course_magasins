import type { Article } from '../lib/types.ts';
import { PROFILS } from '../lib/types.ts';
import { formaterQuantite } from '../lib/parse.ts';

interface Props {
  article: Article;
  onBasculer: () => void;
  onQuantite: (sens: 1 | -1) => void;
  onOptions: () => void;
}

export function Ligne({ article: a, onBasculer, onQuantite, onOptions }: Props) {
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
        <span className="bulle" aria-hidden>
          <span className="bulle-icone">{a.icone ?? '🛒'}</span>
          <span className="bulle-coche">✓</span>
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

      {!a.coche && (
        <div className="qte">
          {peutBaisser && (
            <button className="qte-btn" onClick={() => onQuantite(-1)} aria-label={`Une de moins : ${a.nom}`}>
              −
            </button>
          )}
          {quantite && <span className="qte-valeur">{quantite}</span>}
          <button className="qte-btn" onClick={() => onQuantite(1)} aria-label={`Une de plus : ${a.nom}`}>
            +
          </button>
        </div>
      )}

      <button className="options" onClick={onOptions} aria-label={`Options pour ${a.nom}`}>
        …
      </button>
    </li>
  );
}
