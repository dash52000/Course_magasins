import { useMemo, useState } from 'react';
import type { Foyer } from '../lib/useFoyer.ts';
import { estFavori, type Produit } from '../lib/types.ts';
import { normaliser } from '../lib/normalise.ts';
import type { Message } from './Bandeau.tsx';

interface Props {
  foyer: Foyer;
  informer: (m: Message) => void;
}

export function Favoris({ foyer, informer }: Props) {
  const [filtre, setFiltre] = useState('');
  const [edition, setEdition] = useState(false);

  const dansLaListe = useMemo(
    () => new Set(foyer.articles.filter((a) => !a.coche).map((a) => a.produit_id)),
    [foyer.articles],
  );

  const favoris = useMemo(() => {
    const cle = normaliser(filtre);
    return foyer.produits
      .filter((p) => estFavori(p) && (!cle || p.nom_normalise.includes(cle)))
      .sort((a, b) => b.nb_achats - a.nb_achats || a.nom.localeCompare(b.nom, 'fr'));
  }, [foyer.produits, filtre]);

  const ajouter = async (p: Produit) => {
    foyer.noter('favori_ajout');
    try {
      const fusions = await foyer.ajouter([{ nom: p.nom, quantite: null, unite: null }]);
      const f = fusions[0];
      informer(
        f
          ? {
              texte: `${p.nom} → ×${String(f.apres).replace('.', ',')}`,
              actions: [{ libelle: 'Annuler', faire: () => void foyer.annulerFusion(f) }],
            }
          : { texte: `${p.nom} ajouté à la liste`, duree: 2500 },
      );
    } catch {
      informer({ texte: "L'ajout n'est pas passé. Vérifie le réseau et réessaie." });
    }
  };

  const retirer = (p: Produit) => {
    foyer.noter('favori_etoile');
    void foyer.etoile(p);
    informer({
      texte: `${p.nom} retiré des favoris`,
      actions: [{ libelle: 'Annuler', faire: () => void foyer.majFavori(p, true) }],
    });
  };

  return (
    <section className="ecran">
      <header className="entete">
        <h1 className="titre-ecran">Favoris</h1>
        <button className={edition ? 'btn-entete actif' : 'btn-entete'} onClick={() => setEdition((e) => !e)} aria-pressed={edition}>
          {edition ? 'Terminé' : 'Modifier'}
        </button>
      </header>

      <input
        className="champ champ-filtre"
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
        placeholder="Chercher un favori"
        aria-label="Chercher un favori"
        type="search"
      />

      {edition && <p className="discret">Touche ✕ pour retirer un produit des favoris.</p>}

      {favoris.length === 0 ? (
        <div className="vide">
          <p className="vide-titre">{filtre ? 'Aucun favori ne correspond.' : 'Pas encore de favoris.'}</p>
          <p className="discret">Un produit acheté deux fois devient favori tout seul.</p>
        </div>
      ) : (
        <ul className="etal">
          {favoris.map((p) => {
            const present = dansLaListe.has(p.id);
            return (
              <li key={p.id} className={present ? 'tuile presente' : 'tuile'}>
                <button
                  className="tuile-btn"
                  onClick={() => (edition ? retirer(p) : void ajouter(p))}
                  aria-label={edition ? `Retirer ${p.nom} des favoris` : `Ajouter ${p.nom}${present ? ' (déjà dans la liste)' : ''}`}
                >
                  <span className="tuile-icone" aria-hidden>
                    {p.icone ?? '🛒'}
                  </span>
                  <span className="tuile-nom">{p.nom}</span>
                  {edition ? (
                    <span className="tuile-badge tuile-retirer" aria-hidden>
                      ✕
                    </span>
                  ) : (
                    present && (
                      <span className="tuile-badge" aria-hidden>
                        ✓
                      </span>
                    )
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
