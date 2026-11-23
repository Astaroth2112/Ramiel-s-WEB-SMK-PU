import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStatus,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceStatus,
  UserProfile,
  UserRole,
} from './src/types/index.ts';
import {
  determineRoleForNewUser,
  getTodayDateISO,
  validateStudentInput,
  validateUserInput,
} from './src/utils/attendanceLogic.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const TOKEN_SECRET = process.env.AUTH_SECRET || 'smk-prima-unggul-local-secret-key';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function safeCreateClient(url: string, key: string): SupabaseClient | null {
  if (!isValidHttpUrl(url) || !key) return null;
  try {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (err) {
    console.warn('Supabase initialization skipped due to invalid configuration:', err);
    return null;
  }
}

const supabaseAdmin: SupabaseClient | null = safeCreateClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const supabasePublic: SupabaseClient | null = safeCreateClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
);

const useSupabase = Boolean(supabaseAdmin);

interface StoredUser extends UserProfile {
  passwordHash: string;
}

interface LocalDatabase {
  users: StoredUser[];
  students: Student[];
  employeeAttendance: EmployeeAttendanceRecord[];
  studentAttendance: StudentAttendanceRecord[];
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, original] = storedHash.split(':');
  if (!salt || !original) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(original, 'hex'), Buffer.from(derived, 'hex'));
}

function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, iat: Date.now() }),
    'utf8',
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string;
    };
    return parsed.uid || null;
  } catch {
    return null;
  }
}

function toPublicUser(u: StoredUser): UserProfile {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    nip: u.nip,
    positionTitle: u.positionTitle,
    role: u.role,
    authProvider: u.authProvider,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function createInitialSeed(): LocalDatabase {
  const now = new Date();
  const today = getTodayDateISO();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
  const isoNow = now.toISOString();
  const defaultHash = hashPassword('Password123!');

  const users: StoredUser[] = [
    {
      id: 'usr-admin-01',
      email: 'admin@smkprimaunggul.sch.id',
      fullName: 'Hendra Wijaya, M.Pd.',
      nip: '197904122005011002',
      positionTitle: 'Kepala Tata Usaha & Admin Sistem',
      role: 'admin',
      authProvider: 'local',
      createdAt: isoNow,
      updatedAt: isoNow,
      passwordHash: defaultHash,
    },
    {
      id: 'usr-guru-01',
      email: 'guru@smkprimaunggul.sch.id',
      fullName: 'Siti Rahmawati, S.Kom.',
      nip: '198809152014022004',
      positionTitle: 'Guru Produktif TKJ',
      role: 'guru',
      authProvider: 'local',
      createdAt: isoNow,
      updatedAt: isoNow,
      passwordHash: defaultHash,
    },
    {
      id: 'usr-guru-02',
      email: 'arief.dkv@smkprimaunggul.sch.id',
      fullName: 'Arief Nugroho, S.Sn.',
      nip: '199103222019031007',
      positionTitle: 'Guru Produktif DKV & BC',
      role: 'guru',
      authProvider: 'local',
      createdAt: isoNow,
      updatedAt: isoNow,
      passwordHash: defaultHash,
    },
    {
      id: 'usr-tendik-01',
      email: 'tendik@smkprimaunggul.sch.id',
      fullName: 'Budi Santoso, A.Md.',
      nip: '199311082020121003',
      positionTitle: 'Staf Administrasi Akademik',
      role: 'tenaga_kependidikan',
      authProvider: 'local',
      createdAt: isoNow,
      updatedAt: isoNow,
      passwordHash: defaultHash,
    },
  ];

  const students: Student[] = [
    { id: 'stu-01', nis: '20261001', name: 'Aditya Pratama', className: 'X TKJ 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-02', nis: '20261002', name: 'Aulia Putri Maharani', className: 'X TKJ 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-03', nis: '20261003', name: 'Bagas Kurniawan', className: 'X TKJ 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-04', nis: '20261004', name: 'Citra Lestari', className: 'X TKJ 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-05', nis: '20261005', name: 'Dimas Saputra', className: 'X DKV 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-06', nis: '20261006', name: 'Elvira Ningsih', className: 'X DKV 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-07', nis: '20261007', name: 'Fajar Ramadhan', className: 'X DKV 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-08', nis: '20252001', name: 'Gita Puspita', className: 'XI AK 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-09', nis: '20252002', name: 'Hafiz Maulana', className: 'XI AK 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-10', nis: '20252003', name: 'Indah Permata Sari', className: 'XI BC 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-11', nis: '20252004', name: 'Joko Susilo', className: 'XI BC 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-12', nis: '20243001', name: 'Kartika Dewi', className: 'XII MPLB 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-13', nis: '20243002', name: 'Lutfi Hakim', className: 'XII MPLB 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-14', nis: '20243003', name: 'Maya Anggraini', className: 'XII BD 1', createdAt: isoNow, updatedAt: isoNow },
    { id: 'stu-15', nis: '20243004', name: 'Nanda Rizky', className: 'XII BD 1', createdAt: isoNow, updatedAt: isoNow },
  ];

  const employeeAttendance: EmployeeAttendanceRecord[] = [
    {
      id: 'emp-att-01',
      userId: 'usr-admin-01',
      userName: 'Hendra Wijaya, M.Pd.',
      userEmail: 'admin@smkprimaunggul.sch.id',
      userRole: 'admin',
      nip: '197904122005011002',
      date: yesterday,
      status: 'Hadir',
      checkInTime: `${yesterday}T06:55:00.000Z`,
      checkOutTime: `${yesterday}T15:30:00.000Z`,
      notes: 'Apel pagi & supervisi administrasi',
    },
    {
      id: 'emp-att-02',
      userId: 'usr-guru-01',
      userName: 'Siti Rahmawati, S.Kom.',
      userEmail: 'guru@smkprimaunggul.sch.id',
      userRole: 'guru',
      nip: '198809152014022004',
      date: yesterday,
      status: 'Hadir',
      checkInTime: `${yesterday}T07:02:00.000Z`,
      checkOutTime: `${yesterday}T14:45:00.000Z`,
      notes: 'Mengajar Lab TKJ',
    },
    {
      id: 'emp-att-03',
      userId: 'usr-guru-02',
      userName: 'Arief Nugroho, S.Sn.',
      userEmail: 'arief.dkv@smkprimaunggul.sch.id',
      userRole: 'guru',
      nip: '199103222019031007',
      date: today,
      status: 'Hadir',
      checkInTime: `${today}T00:05:00.000Z`,
      checkOutTime: null,
      notes: 'Praktikum Studio DKV',
    },
  ];

  const studentAttendance: StudentAttendanceRecord[] = [
    {
      id: 'stu-att-01',
      studentId: 'stu-01',
      studentNis: '20261001',
      studentName: 'Aditya Pratama',
      className: 'X TKJ 1',
      date: yesterday,
      status: 'Hadir',
      notes: '',
      recordedById: 'usr-guru-01',
      recordedByName: 'Siti Rahmawati, S.Kom.',
      updatedAt: isoNow,
    },
    {
      id: 'stu-att-02',
      studentId: 'stu-02',
      studentNis: '20261002',
      studentName: 'Aulia Putri Maharani',
      className: 'X TKJ 1',
      date: yesterday,
      status: 'Hadir',
      notes: '',
      recordedById: 'usr-guru-01',
      recordedByName: 'Siti Rahmawati, S.Kom.',
      updatedAt: isoNow,
    },
    {
      id: 'stu-att-03',
      studentId: 'stu-03',
      studentNis: '20261003',
      studentName: 'Bagas Kurniawan',
      className: 'X TKJ 1',
      date: yesterday,
      status: 'Sakit',
      notes: 'Surat keterangan orang tua',
      recordedById: 'usr-guru-01',
      recordedByName: 'Siti Rahmawati, S.Kom.',
      updatedAt: isoNow,
    },
    {
      id: 'stu-att-04',
      studentId: 'stu-04',
      studentNis: '20261004',
      studentName: 'Citra Lestari',
      className: 'X TKJ 1',
      date: yesterday,
      status: 'Hadir',
      notes: '',
      recordedById: 'usr-guru-01',
      recordedByName: 'Siti Rahmawati, S.Kom.',
      updatedAt: isoNow,
    },
  ];

  return { users, students, employeeAttendance, studentAttendance };
}

function readDb(): LocalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(raw) as LocalDatabase;
}

function writeDb(db: LocalDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_FILE);
}

interface AuthedRequest extends Request {
  authUser?: UserProfile;
}

function mapSupabaseProfile(row: Record<string, unknown>): UserProfile {
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

async function authenticateRequest(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Sesi tidak ditemukan. Silakan login kembali.' });
    return;
  }

  if (useSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Token Supabase tidak valid atau kedaluwarsa.' });
      return;
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      res.status(401).json({ error: 'Profil pengguna tidak ditemukan di Supabase.' });
      return;
    }
    req.authUser = mapSupabaseProfile(profile);
    next();
    return;
  }

  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Sesi login tidak valid atau telah berakhir.' });
    return;
  }
  const db = readDb();
  const found = db.users.find((u) => u.id === userId);
  if (!found) {
    res.status(401).json({ error: 'Akun pengguna tidak lagi tersedia.' });
    return;
  }
  req.authUser = toPublicUser(found);
  next();
}

function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengakses fitur ini.' });
      return;
    }
    next();
  };
}

async function startServer() {
  // Ensure local store initialized if not using Supabase
  if (!useSupabase) {
    readDb();
  }

  const app = express();
  app.use(express.json());

  // ---------------------------------------------------------------------------
  // System Info
  // ---------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      backend: useSupabase ? 'supabase' : 'local-store',
    });
  });

  // ---------------------------------------------------------------------------
  // Authentication Routes
  // ---------------------------------------------------------------------------
  app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    if (useSupabase && supabasePublic && supabaseAdmin) {
      const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) {
        res.status(401).json({ error: error?.message || 'Email atau kata sandi salah.' });
        return;
      }
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (!profile) {
        res.status(404).json({ error: 'Profil pengguna tidak ditemukan.' });
        return;
      }
      res.json({
        token: data.session.access_token,
        user: mapSupabaseProfile(profile),
        backend: 'supabase',
      });
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: toPublicUser(user), backend: 'local' });
  });

  app.post('/api/auth/register', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();
    const nip = String(req.body?.nip || '').trim();
    const positionTitle = String(req.body?.positionTitle || '').trim();
    const password = String(req.body?.password || '');

    const validationError = validateUserInput(
      { email, fullName, password, role: 'tenaga_kependidikan' },
      true,
    );
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    if (useSupabase && supabaseAdmin && supabasePublic) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const assignedRole = determineRoleForNewUser(count || 0, 'tenaga_kependidikan');

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          nip,
          position_title: positionTitle || (assignedRole === 'admin' ? 'Administrator Sistem' : 'Staf'),
          role: assignedRole,
        },
      });
      if (createError || !created.user) {
        res.status(400).json({ error: createError?.message || 'Gagal mendaftar ke Supabase Auth.' });
        return;
      }

      const { data: loginData } = await supabasePublic.auth.signInWithPassword({ email, password });
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', created.user.id)
        .single();

      res.status(201).json({
        token: loginData.session?.access_token || '',
        user: profile
          ? mapSupabaseProfile(profile)
          : {
              id: created.user.id,
              email,
              fullName,
              nip,
              positionTitle,
              role: assignedRole,
              authProvider: 'supabase',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
      });
      return;
    }

    const db = readDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'Email sudah terdaftar.' });
      return;
    }
    const assignedRole = determineRoleForNewUser(db.users.length, 'tenaga_kependidikan');
    const nowIso = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      email,
      fullName,
      nip,
      positionTitle: positionTitle || (assignedRole === 'admin' ? 'Administrator Sistem' : 'Staf Sekolah'),
      role: assignedRole,
      authProvider: 'local',
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: hashPassword(password),
    };
    db.users.push(newUser);
    writeDb(db);
    res.status(201).json({ token: signToken(newUser.id), user: toPublicUser(newUser) });
  });

  app.get('/api/auth/me', authenticateRequest, (req: AuthedRequest, res) => {
    res.json({
      user: req.authUser,
      backend: useSupabase ? 'supabase' : 'local',
    });
  });

  // ---------------------------------------------------------------------------
  // User Management Routes (Admin Only — Synced with Supabase Auth + Hard Delete)
  // ---------------------------------------------------------------------------
  app.get('/api/users', authenticateRequest, requireRole('admin'), async (_req, res) => {
    if (useSupabase && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json({ users: (data || []).map(mapSupabaseProfile) });
      return;
    }
    const db = readDb();
    res.json({ users: db.users.map(toPublicUser) });
  });

  app.post('/api/users', authenticateRequest, requireRole('admin'), async (req, res) => {
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

    if (useSupabase && supabaseAdmin) {
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

      res.status(201).json({ user: profile ? mapSupabaseProfile(profile) : null });
      return;
    }

    const db = readDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'Email sudah digunakan oleh pengguna lain.' });
      return;
    }
    const finalRole = determineRoleForNewUser(db.users.length, requestedRole);
    const nowIso = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      email,
      fullName,
      nip,
      positionTitle,
      role: finalRole,
      authProvider: 'local',
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: hashPassword(password),
    };
    db.users.push(newUser);
    writeDb(db);
    res.status(201).json({ user: toPublicUser(newUser) });
  });

  app.put('/api/users/:id', authenticateRequest, requireRole('admin'), async (req, res) => {
    const targetId = req.params.id;
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

    if (useSupabase && supabaseAdmin) {
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
      res.json({ user: mapSupabaseProfile(updated) });
      return;
    }

    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === targetId);
    if (idx === -1) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    if (db.users.some((u) => u.id !== targetId && u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'Email sudah digunakan oleh pengguna lain.' });
      return;
    }
    const existing = db.users[idx];
    db.users[idx] = {
      ...existing,
      email,
      fullName,
      nip,
      positionTitle,
      role,
      updatedAt: new Date().toISOString(),
      passwordHash: password ? hashPassword(password) : existing.passwordHash,
    };
    writeDb(db);
    res.json({ user: toPublicUser(db.users[idx]) });
  });

  app.delete('/api/users/:id', authenticateRequest, requireRole('admin'), async (req: AuthedRequest, res) => {
    const targetId = req.params.id;
    if (req.authUser?.id === targetId) {
      res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
      return;
    }

    if (useSupabase && supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId, false);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ deleted: true, id: targetId });
      return;
    }

    const db = readDb();
    const exists = db.users.some((u) => u.id === targetId);
    if (!exists) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    db.users = db.users.filter((u) => u.id !== targetId);
    db.employeeAttendance = db.employeeAttendance.filter((a) => a.userId !== targetId);
    writeDb(db);
    res.json({ deleted: true, id: targetId });
  });

  // ---------------------------------------------------------------------------
  // Student Data Routes (Admin CRUD, Guru & Admin Read)
  // ---------------------------------------------------------------------------
  app.get('/api/students', authenticateRequest, requireRole('admin', 'guru'), async (req, res) => {
    const className = String(req.query.className || '').trim();
    const search = String(req.query.search || '').trim().toLowerCase();

    if (useSupabase && supabaseAdmin) {
      let query = supabaseAdmin.from('students').select('*').order('class_name').order('name');
      if (className) query = query.eq('class_name', className);
      const { data, error } = await query;
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      let mapped: Student[] = (data || []).map((row) => ({
        id: String(row.id),
        nis: String(row.nis),
        name: String(row.name),
        className: String(row.class_name),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }));
      if (search) {
        mapped = mapped.filter(
          (s) => s.name.toLowerCase().includes(search) || s.nis.toLowerCase().includes(search),
        );
      }
      res.json({ students: mapped });
      return;
    }

    const db = readDb();
    let list = [...db.students];
    if (className) {
      list = list.filter((s) => s.className === className);
    }
    if (search) {
      list = list.filter(
        (s) => s.name.toLowerCase().includes(search) || s.nis.toLowerCase().includes(search),
      );
    }
    list.sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));
    res.json({ students: list });
  });

  app.post('/api/students', authenticateRequest, requireRole('admin'), async (req, res) => {
    const nis = String(req.body?.nis || '').trim();
    const name = String(req.body?.name || '').trim();
    const className = String(req.body?.className || '').trim();
    const err = validateStudentInput({ nis, name, className });
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    if (useSupabase && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('students')
        .insert({ nis, name, class_name: className })
        .select('*')
        .single();
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(201).json({
        student: {
          id: String(data.id),
          nis: String(data.nis),
          name: String(data.name),
          className: String(data.class_name),
          createdAt: String(data.created_at),
          updatedAt: String(data.updated_at),
        },
      });
      return;
    }

    const db = readDb();
    if (db.students.some((s) => s.nis.toLowerCase() === nis.toLowerCase())) {
      res.status(409).json({ error: 'NIS sudah terdaftar pada siswa lain.' });
      return;
    }
    const nowIso = new Date().toISOString();
    const newStudent: Student = {
      id: `stu-${crypto.randomUUID().slice(0, 8)}`,
      nis,
      name,
      className,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.students.push(newStudent);
    writeDb(db);
    res.status(201).json({ student: newStudent });
  });

  app.put('/api/students/:id', authenticateRequest, requireRole('admin'), async (req, res) => {
    const targetId = req.params.id;
    const nis = String(req.body?.nis || '').trim();
    const name = String(req.body?.name || '').trim();
    const className = String(req.body?.className || '').trim();
    const err = validateStudentInput({ nis, name, className });
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    if (useSupabase && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('students')
        .update({ nis, name, class_name: className, updated_at: new Date().toISOString() })
        .eq('id', targetId)
        .select('*')
        .single();
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({
        student: {
          id: String(data.id),
          nis: String(data.nis),
          name: String(data.name),
          className: String(data.class_name),
          createdAt: String(data.created_at),
          updatedAt: String(data.updated_at),
        },
      });
      return;
    }

    const db = readDb();
    const idx = db.students.findIndex((s) => s.id === targetId);
    if (idx === -1) {
      res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
      return;
    }
    if (db.students.some((s) => s.id !== targetId && s.nis.toLowerCase() === nis.toLowerCase())) {
      res.status(409).json({ error: 'NIS sudah digunakan siswa lain.' });
      return;
    }
    db.students[idx] = {
      ...db.students[idx],
      nis,
      name,
      className,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    res.json({ student: db.students[idx] });
  });

  app.delete('/api/students/:id', authenticateRequest, requireRole('admin'), async (req, res) => {
    const targetId = req.params.id;
    if (useSupabase && supabaseAdmin) {
      const { error } = await supabaseAdmin.from('students').delete().eq('id', targetId);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ deleted: true, id: targetId });
      return;
    }

    const db = readDb();
    db.students = db.students.filter((s) => s.id !== targetId);
    db.studentAttendance = db.studentAttendance.filter((a) => a.studentId !== targetId);
    writeDb(db);
    res.json({ deleted: true, id: targetId });
  });

  // ---------------------------------------------------------------------------
  // Employee Attendance Routes (All Roles Can Self-Attend; Admin Sees Recap)
  // ---------------------------------------------------------------------------
  app.get('/api/attendance/employees', authenticateRequest, async (req: AuthedRequest, res) => {
    const scope = String(req.query.scope || 'me'); // 'me' | 'all'
    const startDate = String(req.query.startDate || '').trim();
    const endDate = String(req.query.endDate || '').trim();
    const roleFilter = String(req.query.role || '').trim();

    if (scope === 'all' && req.authUser?.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin yang dapat melihat rekap semua karyawan.' });
      return;
    }

    if (useSupabase && supabaseAdmin) {
      let query = supabaseAdmin
        .from('employee_attendance')
        .select('*, profiles(full_name, email, role, nip)')
        .order('attendance_date', { ascending: false })
        .order('check_in_time', { ascending: false });

      if (scope !== 'all') {
        query = query.eq('user_id', req.authUser!.id);
      }
      if (startDate) query = query.gte('attendance_date', startDate);
      if (endDate) query = query.lte('attendance_date', endDate);

      const { data, error } = await query;
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      let mapped: EmployeeAttendanceRecord[] = (data || []).map((row) => {
        const p = (row.profiles as Record<string, unknown>) || {};
        return {
          id: String(row.id),
          userId: String(row.user_id),
          userName: String(p.full_name || ''),
          userEmail: String(p.email || ''),
          userRole: (p.role as UserRole) || 'tenaga_kependidikan',
          nip: String(p.nip || ''),
          date: String(row.attendance_date),
          status: row.status as EmployeeAttendanceStatus,
          checkInTime: String(row.check_in_time),
          checkOutTime: row.check_out_time ? String(row.check_out_time) : null,
          notes: String(row.notes || ''),
        };
      });
      if (roleFilter) {
        mapped = mapped.filter((r) => r.userRole === roleFilter);
      }
      res.json({ records: mapped });
      return;
    }

    const db = readDb();
    let list = [...db.employeeAttendance];
    if (scope !== 'all') {
      list = list.filter((r) => r.userId === req.authUser!.id);
    }
    if (startDate) list = list.filter((r) => r.date >= startDate);
    if (endDate) list = list.filter((r) => r.date <= endDate);
    if (roleFilter) list = list.filter((r) => r.userRole === roleFilter);
    list.sort((a, b) => b.date.localeCompare(a.date) || b.checkInTime.localeCompare(a.checkInTime));
    res.json({ records: list });
  });

  app.post('/api/attendance/employees/check-in', authenticateRequest, async (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const status = (req.body?.status || 'Hadir') as EmployeeAttendanceStatus;
    const notes = String(req.body?.notes || '').trim();
    const today = getTodayDateISO();
    const nowIso = new Date().toISOString();

    if (!['Hadir', 'Izin', 'Sakit'].includes(status)) {
      res.status(400).json({ error: 'Status kehadiran karyawan tidak valid.' });
      return;
    }

    if (useSupabase && supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('employee_attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (existing) {
        res.status(409).json({ error: 'Anda sudah mencatat kehadiran hari ini.' });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('employee_attendance')
        .insert({
          user_id: user.id,
          attendance_date: today,
          status,
          check_in_time: nowIso,
          notes,
        })
        .select('*')
        .single();
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(201).json({
        record: {
          id: String(data.id),
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          userRole: user.role,
          nip: user.nip,
          date: today,
          status,
          checkInTime: String(data.check_in_time),
          checkOutTime: null,
          notes,
        },
      });
      return;
    }

    const db = readDb();
    const already = db.employeeAttendance.find(
      (r) => r.userId === user.id && r.date === today,
    );
    if (already) {
      res.status(409).json({ error: 'Anda sudah mencatat kehadiran untuk hari ini.' });
      return;
    }
    const record: EmployeeAttendanceRecord = {
      id: `emp-att-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role,
      nip: user.nip,
      date: today,
      status,
      checkInTime: nowIso,
      checkOutTime: null,
      notes,
    };
    db.employeeAttendance.push(record);
    writeDb(db);
    res.status(201).json({ record });
  });

  app.post('/api/attendance/employees/check-out', authenticateRequest, async (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const today = getTodayDateISO();
    const nowIso = new Date().toISOString();

    if (useSupabase && supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('employee_attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (!existing) {
        res.status(400).json({ error: 'Anda belum mencatat kehadiran masuk hari ini.' });
        return;
      }
      if (existing.check_out_time) {
        res.status(409).json({ error: 'Anda sudah mencatat kepulangan hari ini.' });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from('employee_attendance')
        .update({ check_out_time: nowIso })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({
        record: {
          id: String(data.id),
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          userRole: user.role,
          nip: user.nip,
          date: today,
          status: data.status,
          checkInTime: String(data.check_in_time),
          checkOutTime: String(data.check_out_time),
          notes: String(data.notes || ''),
        },
      });
      return;
    }

    const db = readDb();
    const idx = db.employeeAttendance.findIndex(
      (r) => r.userId === user.id && r.date === today,
    );
    if (idx === -1) {
      res.status(400).json({ error: 'Anda belum mencatat kehadiran masuk hari ini.' });
      return;
    }
    if (db.employeeAttendance[idx].checkOutTime) {
      res.status(409).json({ error: 'Anda sudah mencatat jam pulang hari ini.' });
      return;
    }
    db.employeeAttendance[idx] = {
      ...db.employeeAttendance[idx],
      checkOutTime: nowIso,
    };
    writeDb(db);
    res.json({ record: db.employeeAttendance[idx] });
  });

  // ---------------------------------------------------------------------------
  // Student Attendance Routes (Admin & Guru)
  // ---------------------------------------------------------------------------
  app.get('/api/attendance/students', authenticateRequest, requireRole('admin', 'guru'), async (req, res) => {
    const date = String(req.query.date || '').trim();
    const startDate = String(req.query.startDate || '').trim();
    const endDate = String(req.query.endDate || '').trim();
    const className = String(req.query.className || '').trim();
    const search = String(req.query.search || '').trim().toLowerCase();

    if (useSupabase && supabaseAdmin) {
      let query = supabaseAdmin
        .from('student_attendance')
        .select('*, students(nis, name, class_name), profiles:recorded_by(full_name)')
        .order('attendance_date', { ascending: false });
      if (date) query = query.eq('attendance_date', date);
      if (startDate) query = query.gte('attendance_date', startDate);
      if (endDate) query = query.lte('attendance_date', endDate);

      const { data, error } = await query;
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      let mapped: StudentAttendanceRecord[] = (data || []).map((row) => {
        const st = (row.students as Record<string, unknown>) || {};
        const rec = (row.profiles as Record<string, unknown>) || {};
        return {
          id: String(row.id),
          studentId: String(row.student_id),
          studentNis: String(st.nis || ''),
          studentName: String(st.name || ''),
          className: String(st.class_name || ''),
          date: String(row.attendance_date),
          status: row.status as StudentAttendanceStatus,
          notes: String(row.notes || ''),
          recordedById: String(row.recorded_by || ''),
          recordedByName: String(rec.full_name || 'Guru'),
          updatedAt: String(row.updated_at || row.created_at),
        };
      });
      if (className) mapped = mapped.filter((r) => r.className === className);
      if (search) {
        mapped = mapped.filter(
          (r) =>
            r.studentName.toLowerCase().includes(search) ||
            r.studentNis.toLowerCase().includes(search),
        );
      }
      res.json({ records: mapped });
      return;
    }

    const db = readDb();
    let list = [...db.studentAttendance];
    if (date) list = list.filter((r) => r.date === date);
    if (startDate) list = list.filter((r) => r.date >= startDate);
    if (endDate) list = list.filter((r) => r.date <= endDate);
    if (className) list = list.filter((r) => r.className === className);
    if (search) {
      list = list.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search) ||
          r.studentNis.toLowerCase().includes(search),
      );
    }
    list.sort((a, b) => b.date.localeCompare(a.date) || a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName));
    res.json({ records: list });
  });

  app.post('/api/attendance/students/batch', authenticateRequest, requireRole('admin', 'guru'), async (req: AuthedRequest, res) => {
    const date = String(req.body?.date || getTodayDateISO()).trim();
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!date || entries.length === 0) {
      res.status(400).json({ error: 'Tanggal dan daftar absensi siswa wajib diisi.' });
      return;
    }

    const recorder = req.authUser!;
    const nowIso = new Date().toISOString();

    if (useSupabase && supabaseAdmin) {
      const payload = entries.map((e: { studentId: string; status: StudentAttendanceStatus; notes?: string }) => ({
        student_id: e.studentId,
        recorded_by: recorder.id,
        attendance_date: date,
        status: e.status,
        notes: String(e.notes || '').trim(),
        updated_at: nowIso,
      }));
      const { error } = await supabaseAdmin
        .from('student_attendance')
        .upsert(payload, { onConflict: 'student_id,attendance_date' });
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ savedCount: payload.length });
      return;
    }

    const db = readDb();
    let savedCount = 0;
    for (const entry of entries as { studentId: string; status: StudentAttendanceStatus; notes?: string }[]) {
      if (!['Hadir', 'Izin', 'Sakit', 'Alpha'].includes(entry.status)) continue;
      const student = db.students.find((s) => s.id === entry.studentId);
      if (!student) continue;

      const existingIdx = db.studentAttendance.findIndex(
        (r) => r.studentId === student.id && r.date === date,
      );
      const record: StudentAttendanceRecord = {
        id:
          existingIdx >= 0
            ? db.studentAttendance[existingIdx].id
            : `stu-att-${crypto.randomUUID().slice(0, 8)}`,
        studentId: student.id,
        studentNis: student.nis,
        studentName: student.name,
        className: student.className,
        date,
        status: entry.status,
        notes: String(entry.notes || '').trim(),
        recordedById: recorder.id,
        recordedByName: recorder.fullName,
        updatedAt: nowIso,
      };
      if (existingIdx >= 0) {
        db.studentAttendance[existingIdx] = record;
      } else {
        db.studentAttendance.push(record);
      }
      savedCount += 1;
    }
    writeDb(db);
    res.json({ savedCount });
  });

  // ---------------------------------------------------------------------------
  // Dashboard Summary Route
  // ---------------------------------------------------------------------------
  app.get('/api/dashboard/summary', authenticateRequest, async (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const today = getTodayDateISO();

    if (useSupabase && supabaseAdmin) {
      const [{ count: totalEmployees }, { count: totalStudents }, { data: empToday }, { data: stuToday }, { data: myToday }] =
        await Promise.all([
          supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('employee_attendance')
            .select('*, profiles(full_name, email, role, nip)')
            .eq('attendance_date', today),
          supabaseAdmin
            .from('student_attendance')
            .select('*, students(nis, name, class_name), profiles:recorded_by(full_name)')
            .eq('attendance_date', today),
          supabaseAdmin
            .from('employee_attendance')
            .select('*')
            .eq('user_id', user.id)
            .eq('attendance_date', today)
            .maybeSingle(),
        ]);

      const mappedEmpToday: EmployeeAttendanceRecord[] = (empToday || []).map((row) => {
        const p = (row.profiles as Record<string, unknown>) || {};
        return {
          id: String(row.id),
          userId: String(row.user_id),
          userName: String(p.full_name || ''),
          userEmail: String(p.email || ''),
          userRole: (p.role as UserRole) || 'tenaga_kependidikan',
          nip: String(p.nip || ''),
          date: String(row.attendance_date),
          status: row.status as EmployeeAttendanceStatus,
          checkInTime: String(row.check_in_time),
          checkOutTime: row.check_out_time ? String(row.check_out_time) : null,
          notes: String(row.notes || ''),
        };
      });

      const mappedStuToday: StudentAttendanceRecord[] = (stuToday || []).map((row) => {
        const st = (row.students as Record<string, unknown>) || {};
        const rec = (row.profiles as Record<string, unknown>) || {};
        return {
          id: String(row.id),
          studentId: String(row.student_id),
          studentNis: String(st.nis || ''),
          studentName: String(st.name || ''),
          className: String(st.class_name || ''),
          date: String(row.attendance_date),
          status: row.status as StudentAttendanceStatus,
          notes: String(row.notes || ''),
          recordedById: String(row.recorded_by || ''),
          recordedByName: String(rec.full_name || ''),
          updatedAt: String(row.updated_at || row.created_at),
        };
      });

      res.json({
        todayDate: today,
        totalEmployees: totalEmployees || 0,
        employeesPresentToday: mappedEmpToday.filter((r) => r.status === 'Hadir').length,
        employeesLeaveToday: mappedEmpToday.filter((r) => r.status !== 'Hadir').length,
        totalStudents: totalStudents || 0,
        studentsPresentToday: mappedStuToday.filter((r) => r.status === 'Hadir').length,
        studentsAbsentToday: mappedStuToday.filter((r) => r.status !== 'Hadir').length,
        myTodayAttendance: myToday
          ? {
              id: String(myToday.id),
              userId: user.id,
              userName: user.fullName,
              userEmail: user.email,
              userRole: user.role,
              nip: user.nip,
              date: today,
              status: myToday.status,
              checkInTime: String(myToday.check_in_time),
              checkOutTime: myToday.check_out_time ? String(myToday.check_out_time) : null,
              notes: String(myToday.notes || ''),
            }
          : null,
        recentEmployeeLogs: user.role === 'admin' ? mappedEmpToday.slice(0, 6) : mappedEmpToday.filter((r) => r.userId === user.id),
        recentStudentLogs: user.role === 'tenaga_kependidikan' ? [] : mappedStuToday.slice(0, 6),
      });
      return;
    }

    const db = readDb();
    const empToday = db.employeeAttendance.filter((r) => r.date === today);
    const stuToday = db.studentAttendance.filter((r) => r.date === today);
    const myToday = empToday.find((r) => r.userId === user.id) || null;
    const myRecent = db.employeeAttendance
      .filter((r) => r.userId === user.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    const allRecentEmp = [...db.employeeAttendance]
      .sort((a, b) => b.date.localeCompare(a.date) || b.checkInTime.localeCompare(a.checkInTime))
      .slice(0, 6);
    const recentStu = [...db.studentAttendance]
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);

    res.json({
      todayDate: today,
      totalEmployees: db.users.length,
      employeesPresentToday: empToday.filter((r) => r.status === 'Hadir').length,
      employeesLeaveToday: empToday.filter((r) => r.status !== 'Hadir').length,
      totalStudents: db.students.length,
      studentsPresentToday: stuToday.filter((r) => r.status === 'Hadir').length,
      studentsAbsentToday: stuToday.filter((r) => r.status !== 'Hadir').length,
      myTodayAttendance: myToday,
      recentEmployeeLogs: user.role === 'admin' ? allRecentEmp : myRecent,
      recentStudentLogs: user.role === 'tenaga_kependidikan' ? [] : recentStu,
    });
  });

  // ---------------------------------------------------------------------------
  // Frontend Serving (Vite Dev Middleware or Static Production Build)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SMK Prima Unggul server running on http://localhost:${PORT} (${useSupabase ? 'Supabase' : 'Local persistent store'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
