import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();
  const hasServiceRole = Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim());

  res.status(200).json({
    ok: true,
    backend: supabaseUrl && hasServiceRole ? 'supabase' : 'vercel-static',
  });
}
