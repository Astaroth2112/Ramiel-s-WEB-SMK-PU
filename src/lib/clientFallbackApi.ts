import { supabase, isSupabaseConfigured } from './supabaseClient';
import type {
  DashboardSummary,
  EmployeeAttendanceRecord,
  EmployeeAttendanceStatus,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceStatus,
  UserProfile,
  UserRole,
} from '../types';
import {
  determineRoleForNewUser,
  getTodayDateISO,
  validateStudentInput,
  validateUserInput,
} from '../utils/attendanceLogic';

const FALLBACK_DB_KEY = 'smk_prima_unggul_static_db_v1';

interface LocalUserRecord extends UserProfile {
  password: string;
}

interface StaticFallbackDb {
  users: LocalUserRecord[];
  students: Student[];
  employeeAttendance: EmployeeAttendanceRecord[];
  studentAttendance: StudentAttendanceRecord[];
}

function createSeedDatabase(): StaticFallbackDb {
  const now = new Date();
  const today = getTodayDateISO();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
  const isoNow = now.toISOString();

  const users: LocalUserRecord[] = [
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
      password: 'Password123!',
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
      password: 'Password123!',
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
      password: 'Password123!',
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
      password: 'Password123!',
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

function readLocalDb(): StaticFallbackDb {
  try {
    const raw = localStorage.getItem(FALLBACK_DB_KEY);
    if (raw) {
      return JSON.parse(raw) as StaticFallbackDb;
    }
  } catch {
    // ignore storage read error
  }
  const seed = createSeedDatabase();
  writeLocalDb(seed);
  return seed;
}

function writeLocalDb(db: StaticFallbackDb): void {
  try {
    localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(db));
  } catch {
    // ignore storage write error
  }
}

function toPublicUser(u: LocalUserRecord): UserProfile {
  const { password: _pw, ...pub } = u;
  return pub;
}

function encodeLocalToken(userId: string): string {
  return `local-fallback:${userId}`;
}

function decodeLocalToken(token: string | null): string | null {
  if (!token || !token.startsWith('local-fallback:')) return null;
  return token.slice('local-fallback:'.length) || null;
}

function getCurrentLocalUser(token: string | null): UserProfile {
  const uid = decodeLocalToken(token);
  if (!uid) throw new Error('Sesi login tidak valid. Silakan masuk kembali.');
  const db = readLocalDb();
  const user = db.users.find((u) => u.id === uid);
  if (!user) throw new Error('Akun pengguna tidak ditemukan.');
  return toPublicUser(user);
}

function mapSupabaseProfileRow(row: Record<string, unknown>): UserProfile {
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

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function resolveOrHealSupabaseProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}): Promise<UserProfile> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profile) {
    return mapSupabaseProfileRow(profile as Record<string, unknown>);
  }

  const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
  const email = authUser.email || '';
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  const role = determineRoleForNewUser(
    count || 0,
    meta.role as UserRole | undefined,
  );
  const fullName = String(meta.full_name || email.split('@')[0] || 'Pengguna');
  const nip = String(meta.nip || '');
  const positionTitle = String(
    meta.position_title || (role === 'admin' ? 'Administrator Sistem' : 'Staf Sekolah'),
  );

  // Try creating the missing profile row if public.profiles exists & RLS allows
  if (!profErr) {
    const { data: inserted } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email,
        full_name: fullName,
        nip,
        position_title: positionTitle,
        role,
      })
      .select('*')
      .maybeSingle();
    if (inserted) {
      return mapSupabaseProfileRow(inserted as Record<string, unknown>);
    }
  }

  // Fallback profile object from Supabase Auth user so login works cleanly
  const nowIso = authUser.created_at || new Date().toISOString();
  return {
    id: authUser.id,
    email,
    fullName,
    nip,
    positionTitle,
    role,
    authProvider: 'supabase',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

async function getSupabaseCurrentUser(): Promise<UserProfile> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error('Sesi Supabase tidak valid. Silakan login kembali.');
  }
  return resolveOrHealSupabaseProfile(userData.user);
}

export const clientFallbackApi = {
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile; backend: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Email dan kata sandi wajib diisi.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error || !data.session || !data.user) {
        throw new Error(error?.message || 'Email atau kata sandi salah.');
      }
      const userProfile = await resolveOrHealSupabaseProfile(data.user);
      return {
        token: data.session.access_token,
        user: userProfile,
        backend: 'supabase-client',
      };
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || user.password !== password) {
      throw new Error('Email atau kata sandi tidak sesuai.');
    }
    return {
      token: encodeLocalToken(user.id),
      user: toPublicUser(user),
      backend: 'local-browser',
    };
  },

  async register(payload: {
    email: string;
    fullName: string;
    nip: string;
    positionTitle: string;
    password: string;
  }): Promise<{ token: string; user: UserProfile }> {
    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    const nip = payload.nip.trim();
    const positionTitle = payload.positionTitle.trim();
    const validationErr = validateUserInput(
      { email, fullName, password: payload.password, role: 'tenaga_kependidikan' },
      true,
    );
    if (validationErr) throw new Error(validationErr);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          data: {
            full_name: fullName,
            nip,
            position_title: positionTitle,
          },
        },
      });
      if (error || !data.user) {
        throw new Error(error?.message || 'Gagal mendaftar ke Supabase Auth.');
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      const userProfile: UserProfile = profile
        ? mapSupabaseProfileRow(profile as Record<string, unknown>)
        : {
            id: data.user.id,
            email,
            fullName,
            nip,
            positionTitle,
            role: 'tenaga_kependidikan',
            authProvider: 'supabase',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      return {
        token: data.session?.access_token || '',
        user: userProfile,
      };
    }

    const db = readLocalDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Email sudah terdaftar.');
    }
    const role = determineRoleForNewUser(db.users.length, 'tenaga_kependidikan');
    const nowIso = new Date().toISOString();
    const newUser: LocalUserRecord = {
      id: randomId('usr'),
      email,
      fullName,
      nip,
      positionTitle: positionTitle || (role === 'admin' ? 'Administrator Sistem' : 'Staf Sekolah'),
      role,
      authProvider: 'local',
      createdAt: nowIso,
      updatedAt: nowIso,
      password: payload.password,
    };
    db.users.push(newUser);
    writeLocalDb(db);
    return {
      token: encodeLocalToken(newUser.id),
      user: toPublicUser(newUser),
    };
  },

  async me(token: string | null): Promise<{ user: UserProfile; backend: string }> {
    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      return { user, backend: 'supabase-client' };
    }
    return { user: getCurrentLocalUser(token), backend: 'local-browser' };
  },

  async dashboardSummary(token: string | null): Promise<DashboardSummary> {
    const today = getTodayDateISO();

    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      const [
        { count: totalEmployees },
        { count: totalStudents },
        { data: empToday },
        { data: stuToday },
        { data: myToday },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase
          .from('employee_attendance')
          .select('*, profiles(full_name, email, role, nip)')
          .eq('attendance_date', today),
        supabase
          .from('student_attendance')
          .select('*, students(nis, name, class_name), profiles:recorded_by(full_name)')
          .eq('attendance_date', today),
        supabase
          .from('employee_attendance')
          .select('*')
          .eq('user_id', user.id)
          .eq('attendance_date', today)
          .maybeSingle(),
      ]);

      const mappedEmpToday: EmployeeAttendanceRecord[] = (empToday || []).map((row) => {
        const r = row as Record<string, unknown>;
        const p = (r.profiles as Record<string, unknown>) || {};
        return {
          id: String(r.id),
          userId: String(r.user_id),
          userName: String(p.full_name || user.fullName),
          userEmail: String(p.email || user.email),
          userRole: (p.role as UserRole) || user.role,
          nip: String(p.nip || ''),
          date: String(r.attendance_date),
          status: r.status as EmployeeAttendanceStatus,
          checkInTime: String(r.check_in_time),
          checkOutTime: r.check_out_time ? String(r.check_out_time) : null,
          notes: String(r.notes || ''),
        };
      });

      const mappedStuToday: StudentAttendanceRecord[] = (stuToday || []).map((row) => {
        const r = row as Record<string, unknown>;
        const st = (r.students as Record<string, unknown>) || {};
        const rec = (r.profiles as Record<string, unknown>) || {};
        return {
          id: String(r.id),
          studentId: String(r.student_id),
          studentNis: String(st.nis || ''),
          studentName: String(st.name || ''),
          className: String(st.class_name || ''),
          date: String(r.attendance_date),
          status: r.status as StudentAttendanceStatus,
          notes: String(r.notes || ''),
          recordedById: String(r.recorded_by || ''),
          recordedByName: String(rec.full_name || ''),
          updatedAt: String(r.updated_at || r.created_at),
        };
      });

      return {
        todayDate: today,
        totalEmployees: totalEmployees || 0,
        employeesPresentToday: mappedEmpToday.filter((r) => r.status === 'Hadir').length,
        employeesLeaveToday: mappedEmpToday.filter((r) => r.status !== 'Hadir').length,
        totalStudents: totalStudents || 0,
        studentsPresentToday: mappedStuToday.filter((r) => r.status === 'Hadir').length,
        studentsAbsentToday: mappedStuToday.filter((r) => r.status !== 'Hadir').length,
        myTodayAttendance: myToday
          ? {
              id: String((myToday as Record<string, unknown>).id),
              userId: user.id,
              userName: user.fullName,
              userEmail: user.email,
              userRole: user.role,
              nip: user.nip,
              date: today,
              status: (myToday as Record<string, unknown>).status as EmployeeAttendanceStatus,
              checkInTime: String((myToday as Record<string, unknown>).check_in_time),
              checkOutTime: (myToday as Record<string, unknown>).check_out_time
                ? String((myToday as Record<string, unknown>).check_out_time)
                : null,
              notes: String((myToday as Record<string, unknown>).notes || ''),
            }
          : null,
        recentEmployeeLogs:
          user.role === 'admin'
            ? mappedEmpToday.slice(0, 6)
            : mappedEmpToday.filter((r) => r.userId === user.id),
        recentStudentLogs: user.role === 'tenaga_kependidikan' ? [] : mappedStuToday.slice(0, 6),
      };
    }

    const user = getCurrentLocalUser(token);
    const db = readLocalDb();
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

    return {
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
    };
  },

  async getUsers(token: string | null): Promise<{ users: UserProfile[] }> {
    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      if (user.role !== 'admin') throw new Error('Akses khusus Administrator.');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return { users: (data || []).map((row) => mapSupabaseProfileRow(row as Record<string, unknown>)) };
    }

    const user = getCurrentLocalUser(token);
    if (user.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    const db = readLocalDb();
    return { users: db.users.map(toPublicUser) };
  },

  async createUser(
    token: string | null,
    payload: {
      email: string;
      fullName: string;
      nip: string;
      positionTitle: string;
      role: UserRole;
      password: string;
    },
  ): Promise<{ user: UserProfile }> {
    if (isSupabaseConfigured) {
      throw new Error('Pembuatan user oleh Admin memerlukan server backend aktif dengan SUPABASE_SERVICE_ROLE_KEY.');
    }

    const actor = getCurrentLocalUser(token);
    if (actor.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');

    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    const validationErr = validateUserInput(
      { email, fullName, password: payload.password, role: payload.role },
      true,
    );
    if (validationErr) throw new Error(validationErr);

    const db = readLocalDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Email sudah digunakan oleh pengguna lain.');
    }
    const finalRole = determineRoleForNewUser(db.users.length, payload.role);
    const nowIso = new Date().toISOString();
    const newUser: LocalUserRecord = {
      id: randomId('usr'),
      email,
      fullName,
      nip: payload.nip.trim(),
      positionTitle: payload.positionTitle.trim(),
      role: finalRole,
      authProvider: 'local',
      createdAt: nowIso,
      updatedAt: nowIso,
      password: payload.password,
    };
    db.users.push(newUser);
    writeLocalDb(db);
    return { user: toPublicUser(newUser) };
  },

  async updateUser(
    token: string | null,
    id: string,
    payload: {
      email: string;
      fullName: string;
      nip: string;
      positionTitle: string;
      role: UserRole;
      password?: string;
    },
  ): Promise<{ user: UserProfile }> {
    if (isSupabaseConfigured) {
      throw new Error('Perubahan akun & Auth oleh Admin memerlukan server backend aktif dengan SUPABASE_SERVICE_ROLE_KEY.');
    }

    const actor = getCurrentLocalUser(token);
    if (actor.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');

    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    const validationErr = validateUserInput(
      { email, fullName, password: payload.password, role: payload.role },
      false,
    );
    if (validationErr) throw new Error(validationErr);

    const db = readLocalDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Pengguna tidak ditemukan.');
    if (db.users.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
      throw new Error('Email sudah digunakan pengguna lain.');
    }

    const updated: LocalUserRecord = {
      ...db.users[idx],
      email,
      fullName,
      nip: payload.nip.trim(),
      positionTitle: payload.positionTitle.trim(),
      role: payload.role,
      updatedAt: new Date().toISOString(),
      password: payload.password ? payload.password : db.users[idx].password,
    };
    db.users[idx] = updated;
    writeLocalDb(db);
    return { user: toPublicUser(updated) };
  },

  async deleteUser(token: string | null, id: string): Promise<{ deleted: boolean; id: string }> {
    if (isSupabaseConfigured) {
      throw new Error('Hard delete hingga Supabase Auth memerlukan server backend aktif dengan SUPABASE_SERVICE_ROLE_KEY.');
    }

    const actor = getCurrentLocalUser(token);
    if (actor.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    if (actor.id === id) throw new Error('Anda tidak dapat menghapus akun Anda sendiri.');

    const db = readLocalDb();
    db.users = db.users.filter((u) => u.id !== id);
    db.employeeAttendance = db.employeeAttendance.filter((a) => a.userId !== id);
    writeLocalDb(db);
    return { deleted: true, id };
  },

  async getStudents(
    token: string | null,
    params?: { className?: string; search?: string },
  ): Promise<{ students: Student[] }> {
    if (isSupabaseConfigured && supabase) {
      await getSupabaseCurrentUser();
      let query = supabase
        .from('students')
        .select('*')
        .order('class_name', { ascending: true })
        .order('name', { ascending: true });
      if (params?.className) query = query.eq('class_name', params.className);
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,nis.ilike.%${params.search}%`);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return {
        students: (data || []).map((s) => {
          const row = s as Record<string, unknown>;
          return {
            id: String(row.id),
            nis: String(row.nis),
            name: String(row.name),
            className: String(row.class_name),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
          };
        }),
      };
    }

    getCurrentLocalUser(token);
    const db = readLocalDb();
    let list = [...db.students];
    if (params?.className) list = list.filter((s) => s.className === params.className);
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));
    return { students: list };
  },

  async createStudent(
    token: string | null,
    payload: { nis: string; name: string; className: string },
  ): Promise<{ student: Student }> {
    const err = validateStudentInput(payload);
    if (err) throw new Error(err);

    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      if (user.role !== 'admin') throw new Error('Hanya admin yang dapat mengelola data siswa.');
      const { data, error } = await supabase
        .from('students')
        .insert({
          nis: payload.nis.trim(),
          name: payload.name.trim(),
          class_name: payload.className.trim(),
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Gagal menambah siswa.');
      const row = data as Record<string, unknown>;
      return {
        student: {
          id: String(row.id),
          nis: String(row.nis),
          name: String(row.name),
          className: String(row.class_name),
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at),
        },
      };
    }

    const actor = getCurrentLocalUser(token);
    if (actor.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    const db = readLocalDb();
    const nis = payload.nis.trim();
    if (db.students.some((s) => s.nis.toLowerCase() === nis.toLowerCase())) {
      throw new Error('NIS sudah terdaftar pada siswa lain.');
    }
    const nowIso = new Date().toISOString();
    const student: Student = {
      id: randomId('stu'),
      nis,
      name: payload.name.trim(),
      className: payload.className.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.students.push(student);
    writeLocalDb(db);
    return { student };
  },

  async updateStudent(
    token: string | null,
    id: string,
    payload: { nis: string; name: string; className: string },
  ): Promise<{ student: Student }> {
    const err = validateStudentInput(payload);
    if (err) throw new Error(err);

    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      if (user.role !== 'admin') throw new Error('Hanya admin yang dapat mengubah data siswa.');
      const { data, error } = await supabase
        .from('students')
        .update({
          nis: payload.nis.trim(),
          name: payload.name.trim(),
          class_name: payload.className.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Gagal memperbarui data siswa.');
      const row = data as Record<string, unknown>;
      return {
        student: {
          id: String(row.id),
          nis: String(row.nis),
          name: String(row.name),
          className: String(row.class_name),
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at),
        },
      };
    }

    const actor = getCurrentLocalUser(token);
    if (actor.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    const db = readLocalDb();
    const idx = db.students.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Data siswa tidak ditemukan.');
    const nis = payload.nis.trim();
    if (db.students.some((s) => s.id !== id && s.nis.toLowerCase() === nis.toLowerCase())) {
      throw new Error('NIS sudah digunakan oleh siswa lain.');
    }
    const updated: Student = {
      ...db.students[idx],
      nis,
      name: payload.name.trim(),
      className: payload.className.trim(),
      updatedAt: new Date().toISOString(),
    };
    db.students[idx] = updated;
    writeLocalDb(db);
    return { student: updated };
  },

  async deleteStudent(token: string | null, id: string): Promise<{ deleted: boolean; id: string }> {
    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      if (user.role !== 'admin') throw new Error('Hanya admin yang dapat menghapus data siswa.');
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { deleted: true, id };
    }

    const actor = getCurrentLocalUser(token);
    if (actor.role !== 'admin') throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    const db = readLocalDb();
    db.students = db.students.filter((s) => s.id !== id);
    db.studentAttendance = db.studentAttendance.filter((a) => a.studentId !== id);
    writeLocalDb(db);
    return { deleted: true, id };
  },

  async getEmployeeAttendance(
    token: string | null,
    params?: { scope?: 'me' | 'all'; startDate?: string; endDate?: string; role?: string },
  ): Promise<{ records: EmployeeAttendanceRecord[] }> {
    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      const scope = params?.scope === 'all' && user.role === 'admin' ? 'all' : 'me';
      let query = supabase
        .from('employee_attendance')
        .select('*, profiles(full_name, email, role, nip)')
        .order('attendance_date', { ascending: false })
        .order('check_in_time', { ascending: false });
      if (scope === 'me') query = query.eq('user_id', user.id);
      if (params?.startDate) query = query.gte('attendance_date', params.startDate);
      if (params?.endDate) query = query.lte('attendance_date', params.endDate);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      let mapped: EmployeeAttendanceRecord[] = (data || []).map((row) => {
        const r = row as Record<string, unknown>;
        const p = (r.profiles as Record<string, unknown>) || {};
        return {
          id: String(r.id),
          userId: String(r.user_id),
          userName: String(p.full_name || user.fullName),
          userEmail: String(p.email || user.email),
          userRole: (p.role as UserRole) || user.role,
          nip: String(p.nip || ''),
          date: String(r.attendance_date),
          status: r.status as EmployeeAttendanceStatus,
          checkInTime: String(r.check_in_time),
          checkOutTime: r.check_out_time ? String(r.check_out_time) : null,
          notes: String(r.notes || ''),
        };
      });
      if (params?.role) mapped = mapped.filter((r) => r.userRole === params.role);
      return { records: mapped };
    }

    const user = getCurrentLocalUser(token);
    const db = readLocalDb();
    let list = [...db.employeeAttendance];
    const scope = params?.scope === 'all' && user.role === 'admin' ? 'all' : 'me';
    if (scope === 'me') list = list.filter((r) => r.userId === user.id);
    if (params?.startDate) list = list.filter((r) => r.date >= params.startDate!);
    if (params?.endDate) list = list.filter((r) => r.date <= params.endDate!);
    if (params?.role && user.role === 'admin') list = list.filter((r) => r.userRole === params.role);
    list.sort((a, b) => b.date.localeCompare(a.date) || b.checkInTime.localeCompare(a.checkInTime));
    return { records: list };
  },

  async employeeCheckIn(
    token: string | null,
    status: EmployeeAttendanceStatus,
    notes: string,
  ): Promise<{ record: EmployeeAttendanceRecord }> {
    const today = getTodayDateISO();
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      const { data: existing } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('attendance_date', today)
        .maybeSingle();
      if (existing) throw new Error('Anda sudah mencatat kehadiran masuk hari ini.');
      const { data, error } = await supabase
        .from('employee_attendance')
        .insert({
          user_id: user.id,
          attendance_date: today,
          status,
          check_in_time: nowIso,
          notes: notes.trim(),
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Gagal mencatat absensi masuk.');
      const r = data as Record<string, unknown>;
      return {
        record: {
          id: String(r.id),
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          userRole: user.role,
          nip: user.nip,
          date: today,
          status,
          checkInTime: String(r.check_in_time),
          checkOutTime: null,
          notes: String(r.notes || ''),
        },
      };
    }

    const user = getCurrentLocalUser(token);
    const db = readLocalDb();
    if (db.employeeAttendance.some((r) => r.userId === user.id && r.date === today)) {
      throw new Error('Anda sudah mencatat kehadiran masuk hari ini.');
    }
    const record: EmployeeAttendanceRecord = {
      id: randomId('emp-att'),
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.role,
      nip: user.nip,
      date: today,
      status,
      checkInTime: nowIso,
      checkOutTime: null,
      notes: notes.trim(),
    };
    db.employeeAttendance.push(record);
    writeLocalDb(db);
    return { record };
  },

  async employeeCheckOut(token: string | null): Promise<{ record: EmployeeAttendanceRecord }> {
    const today = getTodayDateISO();
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      const { data: existing } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('attendance_date', today)
        .maybeSingle();
      if (!existing) throw new Error('Silakan catat kehadiran masuk terlebih dahulu.');
      if ((existing as Record<string, unknown>).check_out_time) {
        throw new Error('Anda sudah mencatat jam pulang hari ini.');
      }
      const { data, error } = await supabase
        .from('employee_attendance')
        .update({ check_out_time: nowIso })
        .eq('id', String((existing as Record<string, unknown>).id))
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Gagal mencatat jam pulang.');
      const r = data as Record<string, unknown>;
      return {
        record: {
          id: String(r.id),
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          userRole: user.role,
          nip: user.nip,
          date: today,
          status: r.status as EmployeeAttendanceStatus,
          checkInTime: String(r.check_in_time),
          checkOutTime: String(r.check_out_time),
          notes: String(r.notes || ''),
        },
      };
    }

    const user = getCurrentLocalUser(token);
    const db = readLocalDb();
    const idx = db.employeeAttendance.findIndex((r) => r.userId === user.id && r.date === today);
    if (idx < 0) throw new Error('Silakan catat kehadiran masuk terlebih dahulu.');
    if (db.employeeAttendance[idx].checkOutTime) {
      throw new Error('Anda sudah mencatat jam pulang hari ini.');
    }
    db.employeeAttendance[idx] = { ...db.employeeAttendance[idx], checkOutTime: nowIso };
    writeLocalDb(db);
    return { record: db.employeeAttendance[idx] };
  },

  async getStudentAttendance(
    token: string | null,
    params?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      className?: string;
      search?: string;
    },
  ): Promise<{ records: StudentAttendanceRecord[] }> {
    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      if (user.role !== 'admin' && user.role !== 'guru') {
        throw new Error('Akses khusus Admin dan Guru.');
      }
      let query = supabase
        .from('student_attendance')
        .select('*, students(nis, name, class_name), profiles:recorded_by(full_name)')
        .order('attendance_date', { ascending: false });
      if (params?.date) query = query.eq('attendance_date', params.date);
      if (params?.startDate) query = query.gte('attendance_date', params.startDate);
      if (params?.endDate) query = query.lte('attendance_date', params.endDate);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      let mapped: StudentAttendanceRecord[] = (data || []).map((row) => {
        const r = row as Record<string, unknown>;
        const st = (r.students as Record<string, unknown>) || {};
        const rec = (r.profiles as Record<string, unknown>) || {};
        return {
          id: String(r.id),
          studentId: String(r.student_id),
          studentNis: String(st.nis || ''),
          studentName: String(st.name || ''),
          className: String(st.class_name || ''),
          date: String(r.attendance_date),
          status: r.status as StudentAttendanceStatus,
          notes: String(r.notes || ''),
          recordedById: String(r.recorded_by || ''),
          recordedByName: String(rec.full_name || 'Guru'),
          updatedAt: String(r.updated_at || r.created_at),
        };
      });
      if (params?.className) mapped = mapped.filter((r) => r.className === params.className);
      if (params?.search) {
        const q = params.search.trim().toLowerCase();
        mapped = mapped.filter(
          (r) => r.studentName.toLowerCase().includes(q) || r.studentNis.toLowerCase().includes(q),
        );
      }
      return { records: mapped };
    }

    const user = getCurrentLocalUser(token);
    if (user.role !== 'admin' && user.role !== 'guru') {
      throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    }
    const db = readLocalDb();
    let list = [...db.studentAttendance];
    if (params?.date) list = list.filter((r) => r.date === params.date);
    if (params?.startDate) list = list.filter((r) => r.date >= params.startDate!);
    if (params?.endDate) list = list.filter((r) => r.date <= params.endDate!);
    if (params?.className) list = list.filter((r) => r.className === params.className);
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (r) => r.studentName.toLowerCase().includes(q) || r.studentNis.toLowerCase().includes(q),
      );
    }
    list.sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.className.localeCompare(b.className) ||
        a.studentName.localeCompare(b.studentName),
    );
    return { records: list };
  },

  async saveStudentAttendanceBatch(
    token: string | null,
    date: string,
    entries: { studentId: string; status: StudentAttendanceStatus; notes: string }[],
  ): Promise<{ savedCount: number }> {
    const cleanDate = date.trim() || getTodayDateISO();
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const user = await getSupabaseCurrentUser();
      if (user.role !== 'admin' && user.role !== 'guru') {
        throw new Error('Akses khusus Admin dan Guru.');
      }
      const payload = entries.map((e) => ({
        student_id: e.studentId,
        recorded_by: user.id,
        attendance_date: cleanDate,
        status: e.status,
        notes: e.notes.trim(),
        updated_at: nowIso,
      }));
      const { error } = await supabase
        .from('student_attendance')
        .upsert(payload, { onConflict: 'student_id,attendance_date' });
      if (error) throw new Error(error.message);
      return { savedCount: payload.length };
    }

    const recorder = getCurrentLocalUser(token);
    if (recorder.role !== 'admin' && recorder.role !== 'guru') {
      throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.');
    }
    const db = readLocalDb();
    let savedCount = 0;
    for (const entry of entries) {
      if (!['Hadir', 'Izin', 'Sakit', 'Alpha'].includes(entry.status)) continue;
      const student = db.students.find((s) => s.id === entry.studentId);
      if (!student) continue;
      const existingIdx = db.studentAttendance.findIndex(
        (r) => r.studentId === student.id && r.date === cleanDate,
      );
      const record: StudentAttendanceRecord = {
        id: existingIdx >= 0 ? db.studentAttendance[existingIdx].id : randomId('stu-att'),
        studentId: student.id,
        studentNis: student.nis,
        studentName: student.name,
        className: student.className,
        date: cleanDate,
        status: entry.status,
        notes: entry.notes.trim(),
        recordedById: recorder.id,
        recordedByName: recorder.fullName,
        updatedAt: nowIso,
      };
      if (existingIdx >= 0) db.studentAttendance[existingIdx] = record;
      else db.studentAttendance.push(record);
      savedCount += 1;
    }
    writeLocalDb(db);
    return { savedCount };
  },
};
