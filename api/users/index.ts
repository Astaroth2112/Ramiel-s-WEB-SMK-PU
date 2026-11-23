import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '../../src/types/index.ts';
import { determineRoleForNewUser, validateUserInput } from '../../src/utils/attendanceLogic.ts';

function getAdminClient() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email || ''),
    fullName: String(row.full_name || ''),
    nip: String(row.nip || ''),
    positionTitle: String(row.position_title || ''),
    role: (row.role as UserRole) || 'tenaga_kependidikan',
    authProvider: 'supabase',
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

export default async function handler(req: Request, res: Response) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    res.status(503).json({
      error:
        'SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada Environment Variables server.',
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Token otentikasi tidak ditemukan.' });
    return;
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) {
    res.status(401).json({ error: 'Sesi Supabase tidak valid atau telah berakhir.' });
    return;
  }

  const { data: actorProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!actorProfile || actorProfile.role !== 'admin') {
    res.status(403).json({ error: 'Akses khusus Administrator.' });
    return;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ users: (data || []).map((row) => mapProfile(row as Record<string, unknown>)) });
    return;
  }

  if (req.method === 'POST') {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();
    const nip = String(req.body?.nip || '').trim();
    const positionTitle = String(req.body?.positionTitle || '').trim();
    const password = String(req.body?.password || '');
    const requestedRole = req.body?.role as UserRole;

    const validationError = validateUserInput(
      { email, fullName, password, role: requestedRole },
      true,
    );
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const finalRole = determineRoleForNewUser(count || 0, requestedRole);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        nip,
        position_title: positionTitle,
        role: finalRole,
      },
    });

    if (error || !created.user) {
      res.status(400).json({ error: error?.message || 'Gagal membuat user di Supabase Auth.' });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: created.user.id,
        email,
        full_name: fullName,
        nip,
        position_title: positionTitle,
        role: finalRole,
      })
      .select('*')
      .single();

    res.status(201).json({ user: profile ? mapProfile(profile as Record<string, unknown>) : null });
    return;
  }

  res.status(405).json({ error: 'Metode HTTP tidak didukung.' });
}
