import type { Request, Response } from 'express';

function cleanVal(raw: string | undefined): string {
  return (raw || '').trim().replace(/^["']|["']$/g, '').trim();
}

function resolvePublicEnv(
  preferredKeys: string[],
  suffixRegex: RegExp,
  excludeRegex: RegExp,
): string {
  for (const key of preferredKeys) {
    const val = cleanVal(process.env[key]);
    if (val) return val;
  }
  for (const [key, rawVal] of Object.entries(process.env)) {
    if (excludeRegex.test(key)) continue;
    if (suffixRegex.test(key)) {
      const val = cleanVal(rawVal);
      if (val) return val;
    }
  }
  return '';
}

export default function handler(_req: Request, res: Response) {
  const publicSupabaseUrl = resolvePublicEnv(
    ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
    /SUPABASE_URL$/i,
    /POSTGRES|DATABASE|PRISMA/i,
  );
  const publicSupabaseAnonKey = resolvePublicEnv(
    [
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
    ],
    /SUPABASE_(ANON|PUBLISHABLE)_KEY$/i,
    /SERVICE|SECRET|ADMIN|JWT/i,
  );
  const hasServiceRole = Boolean(cleanVal(process.env.SUPABASE_SERVICE_ROLE_KEY));

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    backend: publicSupabaseUrl && hasServiceRole ? 'supabase' : 'vercel-static',
    ...(publicSupabaseUrl && publicSupabaseAnonKey
      ? { publicSupabaseUrl, publicSupabaseAnonKey }
      : {}),
  });
}
