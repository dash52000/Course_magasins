import { useEffect, useMemo, useRef, useState } from 'react';
import type { Foyer, Fusion } from '../lib/useFoyer.ts';
import type { Article, ProfilId } from '../lib/types.ts';
import { PROFILS } from '../lib/types.ts';
import type { Message } from './Bandeau.tsx';
import { AjoutRapide } from './AjoutRapide.tsx';
import { Ligne } from './Ligne.tsx';
import { FeuilleArticle } from './FeuilleArticle.tsx';
import { phraseDeFin } from '../lib/phrases.ts';

interface Props {
  foyer: Foyer;
  profil: ProfilId;
  informer: (m: Message) => void;
}

export function Liste({ foyer, profil, informer }: Props) {
  const [ouvert, setOuvert] = useState<Article | null>(null);
  const [enCours, setEnCours] = useState(false);
  const pied = useRef<HTMLDivElement>(null);

  // Le bandeau d'information se place juste au-dessus du pied, quelle que soit sa hauteur.
  useEffect(() => {
    const el = pied.current;
    if (!el) return;
    const racine = document.documentElement;
    const obs = new ResizeObserver(() => racine.style.setProperty('--pied', `${el.offsetHeight}px`));
    obs.observe(el);
    return () => {
      obs.disconnect();
      racine.style.removeProperty('--pied');
    };
  }, []);

  const { aPrendre, dansLePanier } = useMemo(() => {
    const aPrendre = foyer.articles
      .filter((a) => !a.coche)
      .sort((x, y) => x.cree_le.localeCompare(y.cree_le));
    const dansLePanier = foyer.articles
      .filter((a) => a.coche)
      .sort((x, y) => (y.coche_le ?? '').localeCompare(x.coche_le ?? ''));
    return { aPrendre, dansLePanier };
  }, [foyer.articles]);

  const signalerFusions = (fusions: Fusion[]) => {
    if (!fusions.length) return;
    const ignore = () => foyer.noter('bandeau_fusion', 'ignoree');
    if (fusions.length === 1) {
      const f = fusions[0];
      const qui = f.auteurExistant && f.auteurExistant !== profil ? ` (ajouté par ${PROFILS[f.auteurExistant].prenom})` : '';
      informer({
        texte: `${f.nom} déjà dans la liste${qui} → ×${String(f.apres).replace('.', ',')}`,
        duree: 6000,
        siIgnore: ignore,
        actions: [
          { libelle: 'Séparer', faire: () => { foyer.noter('bandeau_fusion'); void foyer.separerFusion(f); } },
          { libelle: 'Annuler', faire: () => { foyer.noter('annulation'); void foyer.annulerFusion(f); } },
        ],
      });
    } else {
      informer({
        texte: `${fusions.length} produits déjà dans la liste : quantités additionnées`,
        duree: 6000,
        siIgnore: ignore,
        actions: [
          {
            libelle: 'Annuler',
            faire: () => {
              foyer.noter('annulation');
              fusions.forEach((f) => void foyer.annulerFusion(f));
            },
          },
        ],
      });
    }
  };

  const supprimer = async (a: Article) => {
    setOuvert(null);
    foyer.noter('suppression');
    const restaurer = await foyer.supprimer(a);
    informer({
      texte: `${a.nom} supprimé`,
      actions: [{ libelle: 'Annuler', faire: () => { foyer.noter('annulation'); void restaurer(); } }],
    });
  };

  const terminer = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const nb = await foyer.terminer();
      foyer.noter('courses_terminees');
      informer({ texte: phraseDeFin(nb), duree: 4500 });
    } catch {
      informer({ texte: "Les courses n'ont pas pu être enregistrées. Réessaie quand le réseau revient." });
    } finally {
      setEnCours(false);
    }
  };

  const vide = foyer.articles.length === 0 && foyer.statut === 'ok';

  return (
    <section className="ecran ecran-liste">
      <header className="entete">
        <h1 className="titre-app">Panier</h1>
        <span className={`moi auteur-${profil}`} title={`Tu es ${PROFILS[profil].prenom}`}>
          {PROFILS[profil].initiale}
        </span>
      </header>

      {foyer.statut === 'chargement' && <p className="discret centre">Chargement de la liste…</p>}

      {vide && (
        <div className="vide">
          <p className="vide-titre">La liste est vide.</p>
          <p className="discret">Tape ce qu'il faut acheter en bas, ou pioche dans les favoris.</p>
        </div>
      )}

      {aPrendre.length > 0 && (
        <ul className="liste" aria-label="À prendre">
          {aPrendre.map((a) => (
            <Ligne
              key={a.id}
              article={a}
              onBasculer={() => void foyer.basculer(a)}
              onQuantite={(sens) => { foyer.noter('quantite'); void foyer.changerQuantite(a, sens); }}
              onOptions={() => setOuvert(a)}
              onSupprimer={() => void supprimer(a)}
            />
          ))}
        </ul>
      )}

      {dansLePanier.length > 0 && (
        <>
          <h2 className="sous-titre">Dans le panier ({dansLePanier.length})</h2>
          <ul className="liste liste-cochee" aria-label="Dans le panier">
            {dansLePanier.map((a) => (
              <Ligne
                key={a.id}
                article={a}
                onBasculer={() => void foyer.basculer(a)}
                onQuantite={() => {}}
                onOptions={() => setOuvert(a)}
                onSupprimer={() => void supprimer(a)}
              />
            ))}
          </ul>
        </>
      )}

      <div className="pied" ref={pied}>
        {dansLePanier.length > 0 && (
          <button className="terminer" onClick={terminer} disabled={enCours}>
            Courses terminées ({dansLePanier.length})
          </button>
        )}
        <AjoutRapide foyer={foyer} onFusions={signalerFusions} informer={informer} />
      </div>

      {ouvert && (
        <FeuilleArticle
          article={foyer.articles.find((a) => a.id === ouvert.id) ?? ouvert}
          produit={foyer.parProduit.get(ouvert.produit_id)}
          onFermer={() => setOuvert(null)}
          onNote={(texte) => { foyer.noter('note'); void foyer.modifierNote(ouvert, texte); setOuvert(null); }}
          onEtoile={(p) => { foyer.noter('favori_etoile'); void foyer.etoile(p); }}
          onSupprimer={() => void supprimer(ouvert)}
        />
      )}
    </section>
  );
}
