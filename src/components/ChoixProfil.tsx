import type { ProfilId } from '../lib/types.ts';

export function ChoixProfil({ onChoisir }: { onChoisir: (p: ProfilId) => void }) {
  return (
    <main className="ecran-centre">
      <h1 className="titre-app">Panier</h1>
      <p className="question">Qui tient ce téléphone ?</p>
      <div className="choix-profil">
        <button className="profil profil-damien" onClick={() => onChoisir('damien')}>
          <span className="profil-initiale">D</span>
          Damien
        </button>
        <button className="profil profil-laeti" onClick={() => onChoisir('laeti')}>
          <span className="profil-initiale">L</span>
          Laeti
        </button>
      </div>
      <p className="discret">Une seule fois : le téléphone s'en souviendra.</p>
    </main>
  );
}
