export type ProfilId = 'damien' | 'laeti';

export const PROFILS: Record<ProfilId, { prenom: string; initiale: string }> = {
  damien: { prenom: 'Damien', initiale: 'D' },
  laeti: { prenom: 'Laeti', initiale: 'L' },
};

export interface Produit {
  id: string;
  nom: string;
  nom_normalise: string;
  icone: string | null;
  est_favori: boolean;
  favori_auto: boolean;
  quantite_defaut: number | null;
  unite_defaut: string | null;
  note_defaut: string | null;
  issu_du_pack: boolean;
  nb_achats: number;
  dernier_achat: string | null;
  rang_passage: number | null;
  masque: boolean;
  cree_le: string;
}

export interface Article {
  id: string;
  produit_id: string;
  nom: string;
  icone: string | null;
  quantite: number | null;
  unite: string | null;
  note: string | null;
  ajoute_par: ProfilId | null;
  coche: boolean;
  coche_par: ProfilId | null;
  coche_le: string | null;
  cree_le: string;
}

export interface Course {
  id: string;
  date: string;
  montant: number | null;
  magasin: string | null;
  fait_par: ProfilId | null;
  courses_articles?: Array<{ nom: string; icone: string | null; quantite: number | null; unite: string | null }>;
}

/** Fonctions suivies dans le journal d'usage (critère des 3 mois). */
export type Fonction =
  | 'ajout_rapide'
  | 'autocompletion'
  | 'favori_ajout'
  | 'favori_etoile'
  | 'quantite'
  | 'note'
  | 'suppression'
  | 'annulation'
  | 'bandeau_fusion'
  | 'courses_terminees'
  | 'historique'
  | 'export'
  | 'import';
