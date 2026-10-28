import { useMemo, useState } from 'react';
import type { Foyer } from '../lib/useFoyer.ts';
import { estFavori, type Produit } from '../lib/types.ts';
import { normaliser } from '../lib/normalise.ts';
import type { Message } from './Bandeau.tsx';
import { FeuilleFavori } from './FeuilleFavori.tsx';

interface Props {
  foyer: Foyer;
  informer: (m: Message) => void;
}

export function Favoris({ foyer, informer }: Props) {
  const [filtre, setFiltre] = useState('');
  const [edition, setEdition] = useState(false);
  /** Feuille ouverte : 'nouveau' pour créer, ou le produit à modifier. */
  const [feuille, setFeuille] = useState<'nouveau' | Produit | null>(null);

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

  const creer = async (nom: string, icone: string) => {
    setFeuille(null);
    foyer.noter('favori_creation');
    try {
      await foyer.creerFavori(nom, icone);
      setFiltre('');
      informer({ texte: `${icone} ${nom} ajouté aux favoris`, duree: 3000 });
    } catch {
      informer({ texte: "Le favori n'a pas pu être créé. Vérifie le réseau et réessaie." });
    }
  };

  const enregistrer = async (p: Produit, nom: string, icone: string) => {
    foyer.noter('favori_edition');
    try {
      const ok = await foyer.modifierProduit(p, nom, icone);
      if (!ok) {
        informer({ texte: `« ${nom} » existe déjà dans les produits. Choisis un autre nom.` });
        return;
      }
      setFeuille(null);
      informer({ texte: `${icone} ${nom} enregistré`, duree: 2500 });
    } catch {
      informer({ texte: "La modification n'est pas passée. Vérifie le réseau et réessaie." });
    }
  };

  const retirer = (p: Produit) => {
    setFeuille(null);
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
        <div className="entete-actions">
          {!edition && (
            <button className="btn-entete" onClick={() => setFeuille('nouveau')}>
              + Nouveau
            </button>
          )}
          <button className={edition ? 'btn-entete actif' : 'btn-entete'} onClick={() => setEdition((e) => !e)} aria-pressed={edition}>
            {edition ? 'Terminé' : 'Modifier'}
          </button>
        </div>
      </header>

      <input
        className="champ champ-filtre"
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
        placeholder="Chercher un favori"
        aria-label="Chercher un favori"
        type="search"
      />

      {edition && <p className="discret">Touche un favori pour changer son nom ou son icône, ou le retirer.</p>}

      {favoris.length === 0 ? (
        <div className="vide">
          <p className="vide-titre">{filtre ? 'Aucun favori ne correspond.' : 'Pas encore de favoris.'}</p>
          {filtre.trim() ? (
            <button className="btn btn-plein" onClick={() => setFeuille('nouveau')}>
              Créer « {filtre.trim()} » en favori
            </button>
          ) : (
            <p className="discret">Un produit acheté deux fois devient favori tout seul.</p>
          )}
        </div>
      ) : (
        <ul className="etal">
          {favoris.map((p) => {
            const present = dansLaListe.has(p.id);
            return (
              <li key={p.id} className={present ? 'tuile presente' : 'tuile'}>
                <button
                  className="tuile-btn"
                  onClick={() => (edition ? setFeuille(p) : void ajouter(p))}
                  aria-label={edition ? `Modifier ${p.nom}` : `Ajouter ${p.nom}${present ? ' (déjà dans la liste)' : ''}`}
                >
                  <span className="tuile-icone" aria-hidden>
                    {p.icone ?? '🛒'}
                  </span>
                  <span className="tuile-nom">{p.nom}</span>
                  {edition ? (
                    <span className="tuile-badge tuile-modifier" aria-hidden>
                      ✎
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

      {feuille === 'nouveau' && (
        <FeuilleFavori
          nomInitial={filtre.trim()}
          onFermer={() => setFeuille(null)}
          onValider={(nom, icone) => void creer(nom, icone)}
        />
      )}
      {feuille && feuille !== 'nouveau' && (
        <FeuilleFavori
          produit={feuille}
          onFermer={() => setFeuille(null)}
          onValider={(nom, icone) => void enregistrer(feuille, nom, icone)}
          onRetirer={() => retirer(feuille)}
        />
      )}
    </section>
  );
}
