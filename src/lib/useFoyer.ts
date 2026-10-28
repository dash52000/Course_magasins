import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from './supabase.ts';
import { normaliser } from './normalise.ts';
import { devinerIcone } from './icones.ts';
import type { Saisie } from './parse.ts';
import { estFavori, type Article, type Course, type Fonction, type ProfilId, type Produit } from './types.ts';

export type Statut = 'chargement' | 'ok' | 'hors-ligne';

/** Ce qui s'est passé quand un produit déjà dans la liste a été ajouté de nouveau. */
export interface Fusion {
  articleId: string;
  nom: string;
  avant: number | null;
  apres: number | null;
  ajout: { quantite: number | null; unite: string | null; note: string | null };
  auteurExistant: ProfilId | null;
}

function maintenant() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

/** Pas d'incrément des boutons + / − selon l'unité. */
function pas(unite: string | null): number {
  switch (unite) {
    case 'g':
    case 'mL':
      return 100;
    case 'cL':
      return 10;
    case 'kg':
    case 'L':
      return 0.5;
    default:
      return 1;
  }
}

function upsert<T extends { id: string }>(liste: T[], ligne: T): T[] {
  const i = liste.findIndex((x) => x.id === ligne.id);
  if (i === -1) return [...liste, ligne];
  const copie = liste.slice();
  copie[i] = { ...copie[i], ...ligne };
  return copie;
}

export function useFoyer(profil: ProfilId | null) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [statut, setStatut] = useState<Statut>('chargement');
  const produitsRef = useRef<Produit[]>([]);
  const articlesRef = useRef<Article[]>([]);
  produitsRef.current = produits;
  articlesRef.current = articles;

  const charger = useCallback(async () => {
    const [a, p] = await Promise.all([
      db().from('articles_liste').select('*'),
      db().from('produits').select('*'),
    ]);
    if (a.error || p.error) {
      setStatut('hors-ligne');
      return;
    }
    setArticles(a.data as Article[]);
    setProduits(p.data as Produit[]);
    setStatut('ok');
  }, []);

  // Chargement initial + temps réel + rechargement au retour sur l'app.
  useEffect(() => {
    if (!profil) return;
    charger();

    const canal = db()
      .channel('foyer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles_liste' }, (ev) => {
        if (ev.eventType === 'DELETE') {
          const id = (ev.old as { id: string }).id;
          setArticles((l) => l.filter((x) => x.id !== id));
        } else {
          setArticles((l) => upsert(l, ev.new as Article));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produits' }, (ev) => {
        if (ev.eventType === 'DELETE') {
          const id = (ev.old as { id: string }).id;
          setProduits((l) => l.filter((x) => x.id !== id));
        } else {
          setProduits((l) => upsert(l, ev.new as Produit));
        }
      })
      .subscribe((etat) => {
        if (etat === 'SUBSCRIBED') charger();
        if (etat === 'CHANNEL_ERROR' || etat === 'TIMED_OUT') setStatut('hors-ligne');
      });

    const auRetour = () => {
      if (document.visibilityState === 'visible') charger();
    };
    document.addEventListener('visibilitychange', auRetour);
    window.addEventListener('online', charger);

    return () => {
      document.removeEventListener('visibilitychange', auRetour);
      window.removeEventListener('online', charger);
      db().removeChannel(canal);
    };
  }, [profil, charger]);

  /** Journal d'usage : discret, sans effet sur l'app si l'écriture échoue. */
  const noter = useCallback(
    (fonction: Fonction, evenement: 'utilisee' | 'ignoree' = 'utilisee') => {
      void db().from('usage_fonctions').insert({ profil_id: profil, fonction, evenement });
    },
    [profil],
  );

  const majProduit = useCallback(async (id: string, champs: Partial<Produit>) => {
    setProduits((l) => l.map((p) => (p.id === id ? { ...p, ...champs } : p)));
    await db().from('produits').update(champs).eq('id', id);
  }, []);

  const trouverOuCreer = useCallback(async (nom: string): Promise<Produit> => {
    const cle = normaliser(nom);
    const connu = produitsRef.current.find((p) => p.nom_normalise === cle);
    if (connu) return connu;

    const nouveau = {
      id: uuid(),
      nom,
      nom_normalise: cle,
      icone: devinerIcone(nom),
    };
    const { data, error } = await db().from('produits').insert(nouveau).select().single();
    if (!error && data) {
      setProduits((l) => upsert(l, data as Produit));
      return data as Produit;
    }
    // Créé entre-temps par l'autre téléphone : on récupère l'existant.
    const { data: existant } = await db().from('produits').select('*').eq('nom_normalise', cle).single();
    if (existant) {
      setProduits((l) => upsert(l, existant as Produit));
      return existant as Produit;
    }
    throw error ?? new Error('Produit introuvable');
  }, []);

  /** Ajoute des saisies à la liste. Renvoie les fusions faites, pour le bandeau d'information. */
  const ajouter = useCallback(
    async (saisies: Array<Saisie & { note?: string | null }>): Promise<Fusion[]> => {
      const fusions: Fusion[] = [];
      for (const s of saisies) {
        const produit = await trouverOuCreer(s.nom);
        const quantite = s.quantite ?? produit.quantite_defaut;
        const unite = s.quantite !== null ? s.unite : produit.unite_defaut;
        const note = s.note ?? produit.note_defaut;

        // Valeurs par défaut apprises + produit remis en vue s'il avait été masqué.
        const champs: Partial<Produit> = {};
        if (s.quantite !== null) {
          champs.quantite_defaut = s.quantite;
          champs.unite_defaut = s.unite;
        }
        if (produit.masque) champs.masque = false;
        if (Object.keys(champs).length) void majProduit(produit.id, champs);

        const existant = articlesRef.current.find(
          (a) => a.produit_id === produit.id && !a.coche && (a.unite ?? null) === (unite ?? null),
        );

        if (existant) {
          // Fusion : on ajoute ce qui a été tapé (1 par défaut), pas la quantité habituelle.
          const ajoutFusion = s.quantite ?? 1;
          const apres = (existant.quantite ?? 1) + ajoutFusion;
          const maj = { ...existant, quantite: apres };
          setArticles((l) => upsert(l, maj));
          articlesRef.current = upsert(articlesRef.current, maj);
          await db().from('articles_liste').update({ quantite: apres }).eq('id', existant.id);
          fusions.push({
            articleId: existant.id,
            nom: produit.nom,
            avant: existant.quantite,
            apres,
            ajout: { quantite: s.quantite, unite, note: s.note ?? null },
            auteurExistant: existant.ajoute_par,
          });
          continue;
        }

        const article: Article = {
          id: uuid(),
          produit_id: produit.id,
          nom: produit.nom,
          icone: produit.icone,
          quantite,
          unite,
          note,
          ajoute_par: profil,
          coche: false,
          coche_par: null,
          coche_le: null,
          cree_le: maintenant(),
        };
        setArticles((l) => upsert(l, article));
        articlesRef.current = upsert(articlesRef.current, article);
        await db().from('articles_liste').insert(article);
      }
      return fusions;
    },
    [profil, trouverOuCreer, majProduit],
  );

  /** Répercute un nouveau nom ou une nouvelle icône sur les lignes de la liste. */
  const majIconeArticles = async (produitId: string, champs: Partial<Article>) => {
    setArticles((l) => l.map((a) => (a.produit_id === produitId ? { ...a, ...champs } : a)));
    await db().from('articles_liste').update(champs).eq('produit_id', produitId);
  };

  const majArticle = useCallback(async (id: string, champs: Partial<Article>) => {
    setArticles((l) => l.map((a) => (a.id === id ? { ...a, ...champs } : a)));
    await db().from('articles_liste').update(champs).eq('id', id);
  }, []);

  /** Annule une fusion : la quantité revient à sa valeur d'avant. */
  const annulerFusion = useCallback(
    async (f: Fusion) => {
      await majArticle(f.articleId, { quantite: f.avant });
    },
    [majArticle],
  );

  /** Sépare une fusion : la ligne d'origine revient comme avant, l'ajout devient une ligne à part. */
  const separerFusion = useCallback(
    async (f: Fusion) => {
      const origine = articlesRef.current.find((a) => a.id === f.articleId);
      if (!origine) return;
      await majArticle(f.articleId, { quantite: f.avant });
      const article: Article = {
        ...origine,
        id: uuid(),
        quantite: f.ajout.quantite,
        unite: f.ajout.unite,
        note: f.ajout.note,
        ajoute_par: profil,
        cree_le: maintenant(),
      };
      setArticles((l) => upsert(l, article));
      await db().from('articles_liste').insert(article);
    },
    [majArticle, profil],
  );

  const basculer = useCallback(
    (a: Article) =>
      majArticle(
        a.id,
        a.coche
          ? { coche: false, coche_par: null, coche_le: null }
          : { coche: true, coche_par: profil, coche_le: maintenant() },
      ),
    [majArticle, profil],
  );

  const changerQuantite = useCallback(
    (a: Article, sens: 1 | -1) => {
      const p = pas(a.unite);
      const actuelle = a.quantite ?? (a.unite ? 0 : 1);
      const calcul = Math.round((actuelle + sens * p) * 100) / 100;
      let suivante: number | null = calcul;
      if (!a.unite && calcul <= 1) suivante = null;
      if (a.unite && calcul <= 0) suivante = p;
      return majArticle(a.id, { quantite: suivante });
    },
    [majArticle],
  );

  const modifierNote = useCallback(
    async (a: Article, note: string) => {
      const valeur = note.trim() || null;
      await majArticle(a.id, { note: valeur });
      await majProduit(a.produit_id, { note_defaut: valeur });
    },
    [majArticle, majProduit],
  );

  /** Supprime tout de suite ; renvoie de quoi annuler. */
  const supprimer = useCallback(async (a: Article) => {
    setArticles((l) => l.filter((x) => x.id !== a.id));
    await db().from('articles_liste').delete().eq('id', a.id);
    return async () => {
      setArticles((l) => upsert(l, a));
      await db().from('articles_liste').insert(a);
    };
  }, []);

  const terminer = useCallback(async (): Promise<number> => {
    const nb = articlesRef.current.filter((a) => a.coche).length;
    if (!nb) return 0;
    setArticles((l) => l.filter((a) => !a.coche));
    const { error } = await db().rpc('terminer_courses', { p_fait_par: profil });
    if (error) {
      await charger();
      throw error;
    }
    // Les compteurs d'achats et les favoris automatiques arrivent par le temps réel ;
    // on recharge pour être sûr de les avoir même si le canal s'est assoupi.
    void charger();
    return nb;
  }, [profil, charger]);

  const etoile = useCallback(
    (p: Produit) =>
      majProduit(
        p.id,
        estFavori(p)
          ? // Un produit du pack retiré des favoris ne doit pas y revenir tout seul.
            { est_favori: false, favori_auto: false, masque: p.issu_du_pack }
          : { est_favori: true, favori_auto: false, masque: false },
      ),
    [majProduit],
  );

  /** Remet un produit dans l'état favori voulu (utilisé par « Annuler »). */
  const majFavori = useCallback(
    (p: Produit, favori: boolean) => majProduit(p.id, { est_favori: favori, masque: favori ? false : p.masque }),
    [majProduit],
  );

  const masquer = useCallback(
    async (p: Produit) => {
      await majProduit(p.id, { masque: true, est_favori: false });
      return () => majProduit(p.id, { masque: p.masque, est_favori: p.est_favori });
    },
    [majProduit],
  );

  /** Crée un favori (ou remet en favori un produit déjà connu) avec l'icône choisie. */
  const creerFavori = useCallback(
    async (nom: string, icone: string): Promise<Produit> => {
      const produit = await trouverOuCreer(nom);
      await majProduit(produit.id, { est_favori: true, masque: false, icone });
      await majIconeArticles(produit.id, { icone });
      return { ...produit, est_favori: true, masque: false, icone };
    },
    [trouverOuCreer, majProduit],
  );

  /**
   * Renomme un produit et/ou change son icône. Renvoie false si le nouveau nom
   * correspond déjà à un autre produit.
   */
  const modifierProduit = useCallback(
    async (p: Produit, nom: string, icone: string): Promise<boolean> => {
      const cle = normaliser(nom);
      if (cle !== p.nom_normalise && produitsRef.current.some((x) => x.nom_normalise === cle && x.id !== p.id)) {
        return false;
      }
      const champs: Partial<Produit> = { icone };
      if (nom !== p.nom) {
        champs.nom = nom;
        champs.nom_normalise = cle;
      }
      await majProduit(p.id, champs);
      await majIconeArticles(p.id, { icone, ...(champs.nom ? { nom } : {}) });
      return true;
    },
    [majProduit],
  );

  const historique = useCallback(async (): Promise<Course[]> => {
    const { data, error } = await db()
      .from('courses')
      .select('*, courses_articles(nom, icone, quantite, unite, ordre_cochage)')
      .order('date', { ascending: false })
      .limit(60);
    if (error) throw error;
    return data as Course[];
  }, []);

  const exporter = useCallback(async () => {
    const tables = ['produits', 'produits_alias', 'articles_liste', 'courses', 'courses_articles', 'usage_fonctions'];
    const sortie: Record<string, unknown> = { app: 'panier', version: 1, exporte_le: maintenant() };
    for (const t of tables) {
      const { data, error } = await db().from(t).select('*');
      if (error) throw error;
      sortie[t] = data;
    }
    return sortie;
  }, []);

  const importer = useCallback(
    async (donnees: unknown) => {
      const { error } = await db().rpc('restaurer_sauvegarde', { p_data: donnees });
      if (error) throw error;
      await charger();
    },
    [charger],
  );

  const parProduit = useMemo(() => new Map(produits.map((p) => [p.id, p])), [produits]);

  return {
    statut,
    articles,
    produits,
    parProduit,
    ajouter,
    annulerFusion,
    separerFusion,
    basculer,
    changerQuantite,
    modifierNote,
    supprimer,
    terminer,
    etoile,
    majFavori,
    creerFavori,
    modifierProduit,
    masquer,
    historique,
    exporter,
    importer,
    noter,
  };
}

export type Foyer = ReturnType<typeof useFoyer>;
