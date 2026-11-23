import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanVal(raw: string | undefined): string {
  return (raw || '').trim().replace(/^["']|["']$/g, '').trim();
}

const buildSupabaseUrl = cleanVal(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const buildSupabaseAnonKey = cleanVal(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function createSafeSupabase(url: string, key: string): SupabaseClient | null {
  const cleanUrl = cleanVal(url);
  const cleanKey = cleanVal(key);
  if (!isValidHttpUrl(cleanUrl) || !cleanKey) return null;
  try {
    return createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch {
    return null;
  }
}

export let supabase: SupabaseClient | null = createSafeSupabase(
  buildSupabaseUrl,
  buildSupabaseAnonKey,
);
export let isSupabaseConfigured = Boolean(supabase);

let runtimeLookupPromise: Promise<boolean> | null = null;

export async function ensureSupabaseConfigured(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) return true;
  if (runtimeLookupPromise) return runtimeLookupPromise;

  runtimeLookupPromise = (async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return false;
      }
      const data = (await res.json()) as {
        publicSupabaseUrl?: string;
        publicSupabaseAnonKey?: string;
      };
      if (data.publicSupabaseUrl && data.publicSupabaseAnonKey) {
        const client = createSafeSupabase(data.publicSupabaseUrl, data.publicSupabaseAnonKey);
        if (client) {
          supabase = client;
          isSupabaseConfigured = true;
          return true;
        }
      }
    } catch {
      // Ignore runtime health probe failures on pure static hosting
    }
    return false;
  })();

  return runtimeLookupPromise;
}
