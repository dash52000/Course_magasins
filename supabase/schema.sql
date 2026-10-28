-- =====================================================================
-- Panier — schéma Supabase V0
-- Pour installer : coller supabase/setup.sql (schéma + pack de démarrage)
-- dans Supabase > SQL Editor > New query, puis « Run ».
-- Le script peut être relancé sans casse (il ne supprime rien).
-- =====================================================================

-- ---------- Profils ---------------------------------------------------
create table if not exists profils (
  id      text primary key,            -- 'damien' | 'laeti'
  prenom  text not null,
  couleur text not null
);

insert into profils (id, prenom, couleur) values
  ('damien', 'Damien', '#3B82F6'),
  ('laeti',  'Laeti',  '#EC4899')
on conflict (id) do nothing;

-- ---------- Produits canoniques ---------------------------------------
create table if not exists produits (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  nom_normalise   text not null unique,
  icone           text,
  est_favori      boolean not null default false,
  favori_auto     boolean not null default false,
  quantite_defaut numeric,
  unite_defaut    text,
  note_defaut     text,
  issu_du_pack    boolean not null default false,
  nb_achats       integer not null default 0,
  dernier_achat   timestamptz,
  rang_passage    numeric,
  masque          boolean not null default false,  -- retiré par l'utilisateur
  cree_le         timestamptz not null default now()
);

create table if not exists produits_alias (
  alias_normalise text primary key,
  produit_id      uuid not null references produits(id) on delete cascade
);

-- ---------- Liste courante --------------------------------------------
create table if not exists articles_liste (
  id          uuid primary key default gen_random_uuid(),
  produit_id  uuid not null references produits(id) on delete cascade,
  nom         text not null,        -- copie du nom pour l'affichage temps réel
  icone       text,
  quantite    numeric,
  unite       text,
  note        text,
  ajoute_par  text references profils(id),
  coche       boolean not null default false,
  coche_par   text references profils(id),
  coche_le    timestamptz,
  cree_le     timestamptz not null default now()
);

create index if not exists articles_liste_produit on articles_liste(produit_id);

-- ---------- Historique ------------------------------------------------
create table if not exists courses (
  id       uuid primary key default gen_random_uuid(),
  date     timestamptz not null default now(),
  montant  numeric,
  magasin  text,
  fait_par text references profils(id)
);

create table if not exists courses_articles (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  produit_id    uuid references produits(id) on delete set null,
  nom           text not null,
  icone         text,
  quantite      numeric,
  unite         text,
  ordre_cochage integer
);

create index if not exists courses_articles_course on courses_articles(course_id);
create index if not exists courses_articles_produit on courses_articles(produit_id);

-- ---------- Journal d'usage -------------------------------------------
create table if not exists usage_fonctions (
  id         bigint generated always as identity primary key,
  profil_id  text references profils(id),
  fonction   text not null,
  evenement  text not null check (evenement in ('utilisee', 'ignoree')),
  cree_le    timestamptz not null default now()
);

-- ---------- « Courses terminées » (atomique) --------------------------
-- Archive les articles cochés, met à jour les produits (achats, favoris
-- automatiques dès 2 achats), puis retire les articles cochés de la liste.
create or replace function terminer_courses(p_fait_par text)
returns uuid
language plpgsql
as $$
declare
  v_course uuid;
  v_nb     integer;
begin
  select count(*) into v_nb from articles_liste where coche;
  if v_nb = 0 then
    return null;
  end if;

  insert into courses (fait_par) values (p_fait_par) returning id into v_course;

  insert into courses_articles (course_id, produit_id, nom, icone, quantite, unite, ordre_cochage)
  select v_course, produit_id, nom, icone, quantite, unite,
         row_number() over (order by coche_le nulls last, cree_le)
  from articles_liste
  where coche;

  update produits p
  set nb_achats     = p.nb_achats + 1,
      dernier_achat = now(),
      favori_auto   = case when p.nb_achats + 1 >= 2 and not p.est_favori then true else p.favori_auto end,
      est_favori    = case when p.nb_achats + 1 >= 2 then true else p.est_favori end,
      masque        = false
  where p.id in (select distinct produit_id from articles_liste where coche);

  delete from articles_liste where coche;

  return v_course;
end;
$$;

-- ---------- Restauration d'une sauvegarde -----------------------------
-- Remplace toutes les données par le contenu d'un export JSON de l'app.
create or replace function restaurer_sauvegarde(p_data jsonb)
returns void
language plpgsql
as $$
begin
  delete from usage_fonctions;
  delete from courses_articles;
  delete from courses;
  delete from articles_liste;
  delete from produits_alias;
  delete from produits;

  insert into produits
  select * from jsonb_populate_recordset(null::produits, coalesce(p_data->'produits', '[]'));
  insert into produits_alias
  select * from jsonb_populate_recordset(null::produits_alias, coalesce(p_data->'produits_alias', '[]'));
  insert into articles_liste
  select * from jsonb_populate_recordset(null::articles_liste, coalesce(p_data->'articles_liste', '[]'));
  insert into courses
  select * from jsonb_populate_recordset(null::courses, coalesce(p_data->'courses', '[]'));
  insert into courses_articles
  select * from jsonb_populate_recordset(null::courses_articles, coalesce(p_data->'courses_articles', '[]'));
  insert into usage_fonctions (profil_id, fonction, evenement, cree_le)
  select profil_id, fonction, evenement, cree_le
  from jsonb_populate_recordset(null::usage_fonctions, coalesce(p_data->'usage_fonctions', '[]'));
end;
$$;

-- ---------- Accès ------------------------------------------------------
-- Choix assumé (spec §10) : accès par le lien, sans compte.
-- La clé publique peut tout lire et écrire.
alter table profils          enable row level security;
alter table produits         enable row level security;
alter table produits_alias   enable row level security;
alter table articles_liste   enable row level security;
alter table courses          enable row level security;
alter table courses_articles enable row level security;
alter table usage_fonctions  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profils','produits','produits_alias','articles_liste',
                           'courses','courses_articles','usage_fonctions']
  loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'acces_par_lien') then
      execute format('create policy acces_par_lien on %I for all to anon, authenticated using (true) with check (true)', t);
    end if;
  end loop;
end $$;

grant execute on function terminer_courses(text) to anon, authenticated;
grant execute on function restaurer_sauvegarde(jsonb) to anon, authenticated;

-- ---------- Temps réel -------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['articles_liste', 'produits', 'courses']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

alter table articles_liste replica identity full;
