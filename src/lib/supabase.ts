import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const createStorageAdapter = (prefix: string) => ({
  getItem: (key: string) => {
    return localStorage.getItem(`${prefix}:${key}`);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(`${prefix}:${key}`, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(`${prefix}:${key}`);
  },
});

export const supabasePublic = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "adda-public-auth",
    storage: createStorageAdapter("adda-public"),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "adda-admin-auth",
    storage: createStorageAdapter("adda-admin"),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Mantiene compatibilidad con páginas públicas existentes
export const supabase = supabasePublic;