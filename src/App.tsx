import { useCallback, useEffect, useRef, useState } from 'react';
import { configure } from './lib/supabase.ts';
import { useFoyer } from './lib/useFoyer.ts';
import type { ProfilId } from './lib/types.ts';
import { ChoixProfil } from './components/ChoixProfil.tsx';
import { Liste } from './components/Liste.tsx';
import { Favoris } from './components/Favoris.tsx';
import { FoyerEcran } from './components/FoyerEcran.tsx';
import { Bandeau, type Message } from './components/Bandeau.tsx';

type Onglet = 'liste' | 'favoris' | 'foyer';

const CLE_PROFIL = 'panier.profil';

function lireProfil(): ProfilId | null {
  try {
    const v = localStorage.getItem(CLE_PROFIL);
    return v === 'damien' || v === 'laeti' ? v : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [profil, setProfil] = useState<ProfilId | null>(lireProfil);
  const [onglet, setOnglet] = useState<Onglet>('liste');
  const [message, setMessage] = useState<Message | null>(null);
  const foyer = useFoyer(configure ? profil : null);
  const minuteur = useRef<number | undefined>(undefined);

  const choisir = (p: ProfilId) => {
    try {
      localStorage.setItem(CLE_PROFIL, p);
    } catch {
      /* stockage indisponible : le choix vaut pour cette session */
    }
    setProfil(p);
  };

  /** Un seul bandeau à la fois, qui s'efface tout seul. */
  const informer = useCallback((m: Message) => {
    window.clearTimeout(minuteur.current);
    setMessage(m);
    minuteur.current = window.setTimeout(() => {
      setMessage(null);
      m.siIgnore?.();
    }, m.duree ?? 5000);
  }, []);

  const fermer = useCallback(() => {
    window.clearTimeout(minuteur.current);
    setMessage(null);
  }, []);

  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  if (!configure) {
    return (
      <main className="ecran-centre">
        <h1 className="titre-app">Panier</h1>
        <p>L'app n'est pas encore reliée à sa base de données.</p>
        <p className="discret">Renseigne l'URL et la clé publique Supabase dans src/config.ts.</p>
      </main>
    );
  }

  if (!profil) return <ChoixProfil onChoisir={choisir} />;

  const nbCoches = foyer.articles.filter((a) => a.coche).length;
  const nbRestants = foyer.articles.length - nbCoches;

  return (
    <div className="app">
      {foyer.statut === 'hors-ligne' && (
        <div className="alerte" role="status">
          Pas de connexion à la liste. Les changements reprendront au retour du réseau.
        </div>
      )}

      <div className="contenu">
        {onglet === 'liste' && <Liste foyer={foyer} profil={profil} informer={informer} />}
        {onglet === 'favoris' && <Favoris foyer={foyer} informer={informer} />}
        {onglet === 'foyer' && <FoyerEcran foyer={foyer} profil={profil} onChangerProfil={choisir} informer={informer} />}
      </div>

      {message && <Bandeau message={message} onFermer={fermer} />}

      <nav className="onglets" aria-label="Sections">
        <button className={onglet === 'liste' ? 'actif' : ''} onClick={() => setOnglet('liste')} aria-current={onglet === 'liste'}>
          <span aria-hidden>🛒</span>
          Liste
          {nbRestants > 0 && <span className="pastille-compte">{nbRestants}</span>}
        </button>
        <button className={onglet === 'favoris' ? 'actif' : ''} onClick={() => setOnglet('favoris')} aria-current={onglet === 'favoris'}>
          <span aria-hidden>⭐</span>
          Favoris
        </button>
        <button className={onglet === 'foyer' ? 'actif' : ''} onClick={() => setOnglet('foyer')} aria-current={onglet === 'foyer'}>
          <span aria-hidden>🏠</span>
          Foyer
        </button>
      </nav>
    </div>
  );
}
