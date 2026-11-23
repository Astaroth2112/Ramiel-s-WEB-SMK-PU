import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '../../src/types/index.ts';
import { validateUserInput } from '../../src/utils/attendanceLogic.ts';

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

  const rawId = req.query.id;
  const targetId =
    typeof rawId === 'string'
      ? rawId.trim()
      : Array.isArray(rawId) && typeof rawId[0] === 'string'
        ? rawId[0].trim()
        : '';
  if (!targetId) {
    res.status(400).json({ error: 'ID pengguna wajib disertakan.' });
    return;
  }

  if (req.method === 'PUT') {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();
    const nip = String(req.body?.nip || '').trim();
    const positionTitle = String(req.body?.positionTitle || '').trim();
    const password = String(req.body?.password || '');
    const role = req.body?.role as UserRole;

    const validationError = validateUserInput({ email, fullName, password, role }, false);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const authUpdate: {
      email: string;
      password?: string;
      user_metadata: Record<string, string>;
    } = {
      email,
      user_metadata: {
        full_name: fullName,
        nip,
        position_title: positionTitle,
        role,
      },
    };
    if (password) authUpdate.password = password;

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
      targetId,
      authUpdate,
    );
    if (authErr) {
      res.status(400).json({ error: authErr.message });
      return;
    }

    const { data: updated, error: profErr } = await supabaseAdmin
      .from('profiles')
      .update({
        email,
        full_name: fullName,
        nip,
        position_title: positionTitle,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId)
      .select('*')
      .single();

    if (profErr) {
      res.status(400).json({ error: profErr.message });
      return;
    }

    res.status(200).json({ user: mapProfile(updated as Record<string, unknown>) });
    return;
  }

  if (req.method === 'DELETE') {
    if (userData.user.id === targetId) {
      res.status(400).json({
        error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.',
      });
      return;
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId, false);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ deleted: true, id: targetId });
    return;
  }

  res.status(405).json({ error: 'Metode HTTP tidak didukung.' });
}
