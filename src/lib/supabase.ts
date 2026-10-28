import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.ts';
import { creerClientFactice } from '../dev/mock.ts';

// VITE_MOCK=1 : base factice en mémoire, pour développer sans réseau.
const factice = import.meta.env.VITE_MOCK === '1';

export const configure = factice || Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = factice
  ? (creerClientFactice() as SupabaseClient)
  : configure
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export function db(): SupabaseClient {
  if (!supabase) throw new Error('Supabase non configuré');
  return supabase;
}
