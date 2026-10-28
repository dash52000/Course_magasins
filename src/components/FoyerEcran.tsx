import { useEffect, useRef, useState } from 'react';
import type { Foyer } from '../lib/useFoyer.ts';
import type { Course, ProfilId } from '../lib/types.ts';
import { PROFILS } from '../lib/types.ts';
import { formaterQuantite } from '../lib/parse.ts';
import type { Message } from './Bandeau.tsx';

interface Props {
  foyer: Foyer;
  profil: ProfilId;
  onChangerProfil: (p: ProfilId) => void;
  informer: (m: Message) => void;
}

const DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function FoyerEcran({ foyer, profil, onChangerProfil, informer }: Props) {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [aRestaurer, setARestaurer] = useState<{ nom: string; donnees: unknown } | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    foyer.noter('historique');
    foyer
      .historique()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [foyer.historique]);

  const exporter = async () => {
    try {
      const donnees = await foyer.exporter();
      const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `panier-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      lien.click();
      URL.revokeObjectURL(url);
      foyer.noter('export');
    } catch {
      informer({ texte: "L'export n'a pas pu se faire. Vérifie le réseau et réessaie." });
    }
  };

  const lireFichier = async (f: File) => {
    try {
      const donnees = JSON.parse(await f.text());
      if (donnees?.app !== 'panier') throw new Error();
      setARestaurer({ nom: f.name, donnees });
    } catch {
      informer({ texte: "Ce fichier n'est pas une sauvegarde de Panier." });
    }
  };

  const restaurer = async () => {
    if (!aRestaurer) return;
    try {
      await foyer.importer(aRestaurer.donnees);
      foyer.noter('import');
      setARestaurer(null);
      setCourses(await foyer.historique());
      informer({ texte: 'Sauvegarde restaurée.' });
    } catch {
      informer({ texte: "La restauration a échoué. Les données actuelles n'ont pas été modifiées." });
    }
  };

  return (
    <section className="ecran">
      <header className="entete">
        <h1 className="titre-ecran">Foyer</h1>
      </header>

      <div className="bloc">
        <h2 className="sous-titre">Ce téléphone</h2>
        <div className="choix-profil choix-profil-compact">
          {(Object.keys(PROFILS) as ProfilId[]).map((p) => (
            <button
              key={p}
              className={`profil profil-${p}${p === profil ? ' choisi' : ''}`}
              onClick={() => onChangerProfil(p)}
              aria-pressed={p === profil}
            >
              <span className="profil-initiale">{PROFILS[p].initiale}</span>
              {PROFILS[p].prenom}
            </button>
          ))}
        </div>
      </div>

      <div className="bloc">
        <h2 className="sous-titre">Historique des courses</h2>
        {courses === null && <p className="discret">Chargement…</p>}
        {courses?.length === 0 && <p className="discret">Les courses apparaîtront ici après le premier « Courses terminées ».</p>}
        {courses && courses.length > 0 && (
          <ul className="historique">
            {courses.map((c) => {
              const articles = [...(c.courses_articles ?? [])];
              const estOuverte = ouverte === c.id;
              return (
                <li key={c.id} className="course">
                  <button className="course-entete" onClick={() => setOuverte(estOuverte ? null : c.id)} aria-expanded={estOuverte}>
                    <span className="course-date">
                      {DATE.format(new Date(c.date))}
                      <span className="discret"> à {HEURE.format(new Date(c.date))}</span>
                    </span>
                    <span className="course-resume">
                      {articles.length} article{articles.length > 1 ? 's' : ''}
                      {c.fait_par && (
                        <span className={`auteur auteur-${c.fait_par}`} title={`Par ${PROFILS[c.fait_par].prenom}`}>
                          {PROFILS[c.fait_par].initiale}
                        </span>
                      )}
                    </span>
                  </button>
                  {estOuverte && (
                    <ul className="course-articles">
                      {articles.map((a, i) => (
                        <li key={i}>
                          <span aria-hidden>{a.icone ?? '🛒'}</span> {a.nom}
                          <span className="discret"> {formaterQuantite(a.quantite, a.unite)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bloc">
        <h2 className="sous-titre">Sauvegarde</h2>
        <p className="discret">Un fichier avec toute la liste, les produits et l'historique.</p>
        <button className="btn" onClick={exporter}>
          Télécharger une sauvegarde
        </button>
        <button className="btn" onClick={() => fichier.current?.click()}>
          Restaurer une sauvegarde
        </button>
        <input
          ref={fichier}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void lireFichier(f);
            e.target.value = '';
          }}
        />
        {aRestaurer && (
          <div className="confirmation" role="alert">
            <p>
              Restaurer <strong>{aRestaurer.nom}</strong> remplacera toutes les données actuelles, pour vous deux.
            </p>
            <div className="confirmation-actions">
              <button className="btn btn-danger" onClick={restaurer}>
                Remplacer les données
              </button>
              <button className="btn btn-discret" onClick={() => setARestaurer(null)}>
                Garder les données actuelles
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
