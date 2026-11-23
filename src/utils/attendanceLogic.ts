import type {
  EmployeeAttendanceRecord,
  StudentAttendanceRecord,
  UserRole,
} from '../types';

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  children?: { id: string; label: string; path: string }[];
}

export interface MajorCluster {
  clusterNumber: string;
  clusterTitle: string;
  clusterSummary: string;
  competencies: {
    code: string;
    name: string;
    focus: string;
  }[];
}

export const SCHOOL_CLUSTERS: MajorCluster[] = [
  {
    clusterNumber: '01',
    clusterTitle: 'Bidang Teknologi Informasi & Desain Visual',
    clusterSummary:
      'Mempersiapkan talenta infrastruktur jaringan, sistem cloud, dan komunikasi visual berbasis industri digital.',
    competencies: [
      {
        code: 'TKJ',
        name: 'Teknik Komputer dan Jaringan',
        focus: 'Administrasi server, fiber optik, keamanan jaringan, dan cloud infrastructure.',
      },
      {
        code: 'DKV',
        name: 'Desain Komunikasi Visual',
        focus: 'Identitas merek, desain editorial, ilustrasi digital, dan produksi antarmuka.',
      },
    ],
  },
  {
    clusterNumber: '02',
    clusterTitle: 'Bidang Penyiaran & Produksi Media',
    clusterSummary:
      'Menghasilkan tenaga kreatif penyiaran, sinematografi, dan tata produksi konten audio-visual modern.',
    competencies: [
      {
        code: 'BC',
        name: 'Broadcasting dan Perfilman',
        focus: 'Tata kamera, penyutradaraan, penyuntingan video, dan siaran langsung multi-kamera.',
      },
    ],
  },
  {
    clusterNumber: '03',
    clusterTitle: 'Bidang Bisnis, Keuangan & Manajemen',
    clusterSummary:
      'Membangun profesional akuntansi, tata kelola perkantoran modern, dan pemasaran niaga digital.',
    competencies: [
      {
        code: 'AK',
        name: 'Akuntansi dan Keuangan Lembaga',
        focus: 'Pelaporan keuangan standar PSAK, perpajakan, dan audit berbasis perangkat lunak.',
      },
      {
        code: 'MPLB',
        name: 'Manajemen Perkantoran dan Layanan Bisnis',
        focus: 'Administrasi korporat, korespondensi eksekutif, kearsipan digital, dan layanan prima.',
      },
      {
        code: 'BD',
        name: 'Bisnis Digital',
        focus: 'Pemasaran digital, analitik e-commerce, pengembangan toko daring, dan strategi konten.',
      },
    ],
  },
];

export const CLASS_LIST: string[] = [
  'X TKJ 1',
  'X DKV 1',
  'X AK 1',
  'X BC 1',
  'X MPLB 1',
  'X BD 1',
  'XI TKJ 1',
  'XI DKV 1',
  'XI AK 1',
  'XI BC 1',
  'XI MPLB 1',
  'XI BD 1',
  'XII TKJ 1',
  'XII DKV 1',
  'XII AK 1',
  'XII BC 1',
  'XII MPLB 1',
  'XII BD 1',
];

export function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'guru':
      return 'Guru';
    case 'tenaga_kependidikan':
      return 'Tenaga Kependidikan';
  }
}

export function getMenusForRole(role: UserRole): NavItem[] {
  if (role === 'admin') {
    return [
      { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard' },
      { id: 'absensi-karyawan', label: 'Absensi Karyawan', path: '/app/absensi-karyawan' },
      { id: 'absensi-siswa', label: 'Absensi Siswa', path: '/app/absensi-siswa' },
      {
        id: 'rekap-absensi',
        label: 'Rekap Absensi',
        children: [
          { id: 'rekap-karyawan', label: 'Absensi Karyawan', path: '/app/rekap/karyawan' },
          { id: 'rekap-siswa', label: 'Absensi Siswa', path: '/app/rekap/siswa' },
        ],
      },
      { id: 'data-siswa', label: 'Data Siswa', path: '/app/data-siswa' },
      { id: 'users', label: 'User Management', path: '/app/users' },
    ];
  }

  if (role === 'guru') {
    return [
      { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard' },
      { id: 'absensi-karyawan', label: 'Absensi Karyawan', path: '/app/absensi-karyawan' },
      { id: 'absensi-siswa', label: 'Absensi Siswa', path: '/app/absensi-siswa' },
      {
        id: 'rekap-absensi',
        label: 'Rekap Absensi',
        children: [
          { id: 'rekap-siswa', label: 'Absensi Siswa', path: '/app/rekap/siswa' },
        ],
      },
    ];
  }

  return [
    { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard' },
    { id: 'absensi-karyawan', label: 'Absensi Karyawan', path: '/app/absensi-karyawan' },
  ];
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/app/dashboard';
  if (normalized === '/app' || normalized === '/app/dashboard') return true;
  if (normalized === '/app/absensi-karyawan') return true;

  if (role === 'admin') {
    return [
      '/app/absensi-siswa',
      '/app/rekap/karyawan',
      '/app/rekap/siswa',
      '/app/data-siswa',
      '/app/users',
    ].includes(normalized);
  }

  if (role === 'guru') {
    return ['/app/absensi-siswa', '/app/rekap/siswa'].includes(normalized);
  }

  return false;
}

/**
 * Enforces the rule: the very first user created in Authentication gets 'admin'.
 */
export function determineRoleForNewUser(
  existingUserCount: number,
  requestedRole?: UserRole,
): UserRole {
  if (existingUserCount === 0) {
    return 'admin';
  }
  if (
    requestedRole === 'admin' ||
    requestedRole === 'guru' ||
    requestedRole === 'tenaga_kependidikan'
  ) {
    return requestedRole;
  }
  return 'tenaga_kependidikan';
}

export function validateStudentInput(input: {
  nis: string;
  name: string;
  className: string;
}): string | null {
  const nis = input.nis.trim();
  const name = input.name.trim();
  const className = input.className.trim();

  if (!nis) return 'NIS wajib diisi.';
  if (!/^[A-Za-z0-9.-]{4,20}$/.test(nis)) {
    return 'Format NIS harus 4-20 karakter alfanumerik.';
  }
  if (name.length < 2) return 'Nama lengkap siswa minimal 2 karakter.';
  if (!className) return 'Kelas wajib dipilih.';
  return null;
}

export function validateUserInput(
  input: {
    email: string;
    fullName: string;
    password?: string;
    role: UserRole;
  },
  requirePassword: boolean,
): string | null {
  const email = input.email.trim();
  const fullName = input.fullName.trim();

  if (!fullName || fullName.length < 2) {
    return 'Nama lengkap minimal 2 karakter.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Format email tidak valid.';
  }
  if (requirePassword && (!input.password || input.password.length < 6)) {
    return 'Kata sandi minimal 6 karakter.';
  }
  if (!requirePassword && input.password && input.password.length > 0 && input.password.length < 6) {
    return 'Kata sandi baru minimal 6 karakter.';
  }
  if (!['admin', 'guru', 'tenaga_kependidikan'].includes(input.role)) {
    return 'Role pengguna tidak valid.';
  }
  return null;
}

export function summarizeEmployeeAttendance(records: EmployeeAttendanceRecord[]) {
  return records.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'Hadir') acc.hadir += 1;
      else if (item.status === 'Izin') acc.izin += 1;
      else if (item.status === 'Sakit') acc.sakit += 1;
      return acc;
    },
    { total: 0, hadir: 0, izin: 0, sakit: 0 },
  );
}

export function summarizeStudentAttendance(records: StudentAttendanceRecord[]) {
  return records.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'Hadir') acc.hadir += 1;
      else if (item.status === 'Izin') acc.izin += 1;
      else if (item.status === 'Sakit') acc.sakit += 1;
      else if (item.status === 'Alpha') acc.alpha += 1;
      return acc;
    },
    { total: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0 },
  );
}

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

export function formatEmployeeRecapCsv(records: EmployeeAttendanceRecord[]): string {
  const headers = ['Tanggal', 'NIP', 'Nama Karyawan', 'Role', 'Status', 'Jam Masuk', 'Jam Pulang', 'Catatan'];
  const rows = records.map((r) => [
    r.date,
    r.nip || '-',
    r.userName,
    formatRoleLabel(r.userRole),
    r.status,
    formatTimeShort(r.checkInTime),
    r.checkOutTime ? formatTimeShort(r.checkOutTime) : '-',
    r.notes || '-',
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function formatStudentRecapCsv(records: StudentAttendanceRecord[]): string {
  const headers = ['Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Status', 'Dicatat Oleh', 'Catatan'];
  const rows = records.map((r) => [
    r.date,
    r.studentNis,
    r.studentName,
    r.className,
    r.status,
    r.recordedByName || '-',
    r.notes || '-',
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function formatTimeShort(isoString: string | null): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getTodayDateISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
