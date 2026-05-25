import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabasePublic = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "adda-public-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "adda-admin-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Mantiene compatibilidad con páginas públicas existentes
export const supabase = supabasePublic;