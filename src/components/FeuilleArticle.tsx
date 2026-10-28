import { useState } from 'react';
import type { Article, Produit } from '../lib/types.ts';
import { Feuille } from './Feuille.tsx';

interface Props {
  article: Article;
  produit: Produit | undefined;
  onFermer: () => void;
  onNote: (texte: string) => void;
  onEtoile: (p: Produit) => void;
  onSupprimer: () => void;
}

export function FeuilleArticle({ article, produit, onFermer, onNote, onEtoile, onSupprimer }: Props) {
  const [note, setNote] = useState(article.note ?? '');

  return (
    <Feuille titre={`${article.icone ?? ''} ${article.nom}`} onFermer={onFermer}>
      <form
        className="feuille-form"
        onSubmit={(e) => {
          e.preventDefault();
          onNote(note);
        }}
      >
        <label className="etiquette" htmlFor="note-article">
          Note
        </label>
        <input
          id="note-article"
          className="champ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="la marque bio, si promo…"
          enterKeyHint="done"
        />
        <button className="btn btn-plein" type="submit">
          Enregistrer la note
        </button>
      </form>

      {produit && (
        <button className="btn" onClick={() => onEtoile(produit)}>
          {produit.est_favori ? '★ Retirer des favoris' : '☆ Mettre en favori'}
        </button>
      )}
      <button className="btn btn-danger" onClick={onSupprimer}>
        Supprimer de la liste
      </button>
    </Feuille>
  );
}
