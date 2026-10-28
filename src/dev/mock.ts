// Faux client Supabase en mémoire, pour développer et tester l'interface sans réseau.
// Activé seulement avec VITE_MOCK=1 (jamais dans le build de production).
import { PACK } from '../lib/pack.ts';
import { normaliser } from '../lib/normalise.ts';

type Ligne = Record<string, any>;

const tables: Record<string, Ligne[]> = {
  produits: PACK.map(([nom, icone]) => ({
    id: crypto.randomUUID(),
    nom,
    nom_normalise: normaliser(nom),
    icone,
    est_favori: true,
    favori_auto: false,
    quantite_defaut: null,
    unite_defaut: null,
    note_defaut: null,
    issu_du_pack: true,
    nb_achats: 0,
    dernier_achat: null,
    rang_passage: null,
    masque: false,
    cree_le: new Date().toISOString(),
  })),
  produits_alias: [],
  articles_liste: [],
  courses: [],
  courses_articles: [],
  usage_fonctions: [],
};

const ecouteurs: Array<{ table: string; cb: (ev: any) => void }> = [];

function emettre(table: string, eventType: string, nouveau: Ligne | null, ancien: Ligne | null) {
  for (const e of ecouteurs) if (e.table === table) e.cb({ eventType, new: nouveau, old: ancien });
}

class Requete {
  private filtres: Array<[string, unknown]> = [];
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private valeurs: any;
  private unique = false;
  private tri: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private avecArticles = false;

  constructor(private table: string) {}

  select(colonnes = '*') {
    if (this.action === 'select') this.action = 'select';
    this.avecArticles = colonnes.includes('courses_articles');
    return this;
  }
  insert(v: any) {
    this.action = 'insert';
    this.valeurs = v;
    return this;
  }
  update(v: any) {
    this.action = 'update';
    this.valeurs = v;
    return this;
  }
  delete() {
    this.action = 'delete';
    return this;
  }
  eq(col: string, val: unknown) {
    this.filtres.push([col, val]);
    return this;
  }
  order(col: string, o: { ascending: boolean }) {
    this.tri = { col, asc: o.ascending };
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  single() {
    this.unique = true;
    return this;
  }

  private correspond(l: Ligne) {
    return this.filtres.every(([c, v]) => l[c] === v);
  }

  private executer(): { data: any; error: any } {
    const t = tables[this.table];
    if (this.action === 'insert') {
      const lignes = (Array.isArray(this.valeurs) ? this.valeurs : [this.valeurs]).map((v: Ligne) => ({
        id: crypto.randomUUID(),
        cree_le: new Date().toISOString(),
        ...(this.table === 'produits'
          ? { est_favori: false, favori_auto: false, issu_du_pack: false, nb_achats: 0, masque: false }
          : {}),
        ...(this.table === 'articles_liste' ? { coche: false } : {}),
        ...v,
      }));
      if (this.table === 'produits' && lignes.some((l: Ligne) => t.some((x) => x.nom_normalise === l.nom_normalise))) {
        return { data: null, error: { code: '23505' } };
      }
      t.push(...lignes);
      lignes.forEach((l: Ligne) => emettre(this.table, 'INSERT', l, null));
      return { data: this.unique ? lignes[0] : lignes, error: null };
    }
    if (this.action === 'update') {
      for (const l of t.filter((x) => this.correspond(x))) {
        Object.assign(l, this.valeurs);
        emettre(this.table, 'UPDATE', { ...l }, null);
      }
      return { data: null, error: null };
    }
    if (this.action === 'delete') {
      const supprimees = t.filter((x) => this.correspond(x));
      tables[this.table] = t.filter((x) => !this.correspond(x));
      supprimees.forEach((l) => emettre(this.table, 'DELETE', null, { id: l.id }));
      return { data: null, error: null };
    }
    let r = t.filter((x) => this.correspond(x)).map((x) => ({ ...x }));
    if (this.avecArticles) {
      r = r.map((c) => ({ ...c, courses_articles: tables.courses_articles.filter((a) => a.course_id === c.id) }));
    }
    if (this.tri) {
      const { col, asc } = this.tri;
      r.sort((a, b) => (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1));
    }
    if (this.max !== null) r = r.slice(0, this.max);
    if (this.unique) return r[0] ? { data: r[0], error: null } : { data: null, error: { code: 'PGRST116' } };
    return { data: r, error: null };
  }

  then(ok: (v: any) => any, ko?: (e: any) => any) {
    return Promise.resolve(this.executer()).then(ok, ko);
  }
}

function terminerCourses(faitPar: string) {
  const coches = tables.articles_liste.filter((a) => a.coche);
  if (!coches.length) return null;
  const course = { id: crypto.randomUUID(), date: new Date().toISOString(), montant: null, magasin: null, fait_par: faitPar };
  tables.courses.push(course);
  coches
    .sort((a, b) => (a.coche_le ?? '').localeCompare(b.coche_le ?? ''))
    .forEach((a, i) =>
      tables.courses_articles.push({ id: crypto.randomUUID(), course_id: course.id, produit_id: a.produit_id, nom: a.nom, icone: a.icone, quantite: a.quantite, unite: a.unite, ordre_cochage: i + 1 }),
    );
  for (const p of tables.produits) {
    if (coches.some((a) => a.produit_id === p.id)) {
      p.nb_achats += 1;
      p.dernier_achat = new Date().toISOString();
      if (p.nb_achats >= 2) {
        if (!p.est_favori) p.favori_auto = true;
        p.est_favori = true;
      }
      p.masque = false;
      emettre('produits', 'UPDATE', { ...p }, null);
    }
  }
  tables.articles_liste = tables.articles_liste.filter((a) => !a.coche);
  coches.forEach((a) => emettre('articles_liste', 'DELETE', null, { id: a.id }));
  return course.id;
}

export function creerClientFactice(): any {
  return {
    from: (t: string) => new Requete(t),
    rpc: async (nom: string, args: any) => {
      if (nom === 'terminer_courses') return { data: terminerCourses(args.p_fait_par), error: null };
      if (nom === 'restaurer_sauvegarde') {
        for (const t of Object.keys(tables)) tables[t] = args.p_data[t] ?? [];
        return { data: null, error: null };
      }
      return { data: null, error: { message: 'rpc inconnue' } };
    },
    channel: () => {
      const canal = {
        on: (_type: string, filtre: { table: string }, cb: (ev: any) => void) => {
          ecouteurs.push({ table: filtre.table, cb });
          return canal;
        },
        subscribe: (cb?: (etat: string) => void) => {
          setTimeout(() => cb?.('SUBSCRIBED'), 0);
          return canal;
        },
      };
      return canal;
    },
    removeChannel: () => {
      ecouteurs.length = 0;
    },
  };
}
