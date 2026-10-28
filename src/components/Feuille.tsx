import { useEffect, type ReactNode } from 'react';

/** Feuille qui monte du bas de l'écran ; se ferme au tap à côté ou avec Échap. */
export function Feuille({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: ReactNode }) {
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);

  return (
    <div className="voile" onClick={onFermer}>
      <div className="feuille" role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        <div className="feuille-poignee" aria-hidden />
        <h2 className="feuille-titre">{titre}</h2>
        {children}
        <button className="btn btn-discret" onClick={onFermer}>
          Fermer
        </button>
      </div>
    </div>
  );
}
