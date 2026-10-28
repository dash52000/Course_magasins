// Génère supabase/seed.sql (pack de démarrage) et supabase/setup.sql (schéma + pack).
// Usage : npm run gen:setup
import { readFileSync, writeFileSync } from 'node:fs';
import { normaliser } from '../src/lib/normalise.ts';
import { PACK } from '../src/lib/pack.ts';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const lignes = PACK.map(([nom, icone]) => `  (${q(nom)}, ${q(normaliser(nom))}, ${q(icone)}, true, true)`);

const seed = `-- Pack de démarrage (généré par scripts/gen-setup.ts, ne pas éditer à la main)
insert into produits (nom, nom_normalise, icone, issu_du_pack, est_favori) values
${lignes.join(',\n')}
on conflict (nom_normalise) do nothing;

-- Le pack apparaît dans les favoris (rattrapage si une première version du script a déjà tourné).
update produits set est_favori = true
where issu_du_pack and not est_favori and not masque and nb_achats = 0;
`;

writeFileSync('supabase/seed.sql', seed);

const schema = readFileSync('supabase/schema.sql', 'utf8');
writeFileSync('supabase/setup.sql', `${schema}\n${seed}`);

console.log(`seed.sql et setup.sql générés (${PACK.length} produits).`);
