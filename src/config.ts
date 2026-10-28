// Connexion au projet Supabase du foyer.
// La clé « anon » est publique par nature : elle peut figurer ici (choix assumé, cf. spec §10).
// Ne jamais mettre la clé « service_role / secret » dans ce fichier.
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://iolmjlqcvipzsihvrxlj.supabase.co';

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbG1qbHFjdmlwenNpaHZyeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNDgzNDMsImV4cCI6MjEwODcyNDM0M30.WVYQtlX69QpBYjsIUnH2srL0bSpavVM3dO9pH6mAv0I';
