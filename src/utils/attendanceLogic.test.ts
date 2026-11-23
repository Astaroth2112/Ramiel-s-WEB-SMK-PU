import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessPath,
  determineRoleForNewUser,
  formatEmployeeRecapCsv,
  formatStudentRecapCsv,
  getMenusForRole,
  summarizeEmployeeAttendance,
  summarizeStudentAttendance,
  validateStudentInput,
  validateUserInput,
} from './attendanceLogic';

test('first user created always receives admin role', () => {
  assert.equal(determineRoleForNewUser(0, 'guru'), 'admin');
  assert.equal(determineRoleForNewUser(0, 'tenaga_kependidikan'), 'admin');
  assert.equal(determineRoleForNewUser(1, 'guru'), 'guru');
  assert.equal(determineRoleForNewUser(2), 'tenaga_kependidikan');
});

test('role menu visibility matches specification', () => {
  const adminMenus = getMenusForRole('admin');
  assert.deepEqual(
    adminMenus.map((m) => m.id),
    ['dashboard', 'absensi-karyawan', 'absensi-siswa', 'rekap-absensi', 'data-siswa', 'users'],
  );
  const adminRekap = adminMenus.find((m) => m.id === 'rekap-absensi');
  assert.equal(adminRekap?.children?.length, 2);

  const guruMenus = getMenusForRole('guru');
  assert.deepEqual(
    guruMenus.map((m) => m.id),
    ['dashboard', 'absensi-karyawan', 'absensi-siswa', 'rekap-absensi'],
  );
  const guruRekap = guruMenus.find((m) => m.id === 'rekap-absensi');
  assert.deepEqual(
    guruRekap?.children?.map((c) => c.id),
    ['rekap-siswa'],
  );

  const staffMenus = getMenusForRole('tenaga_kependidikan');
  assert.deepEqual(
    staffMenus.map((m) => m.id),
    ['dashboard', 'absensi-karyawan'],
  );
});

test('route access guard enforces role boundaries', () => {
  assert.equal(canAccessPath('admin', '/app/users'), true);
  assert.equal(canAccessPath('guru', '/app/users'), false);
  assert.equal(canAccessPath('guru', '/app/data-siswa'), false);
  assert.equal(canAccessPath('guru', '/app/absensi-siswa'), true);
  assert.equal(canAccessPath('guru', '/app/rekap/karyawan'), false);
  assert.equal(canAccessPath('guru', '/app/rekap/siswa'), true);
  assert.equal(canAccessPath('tenaga_kependidikan', '/app/absensi-karyawan'), true);
  assert.equal(canAccessPath('tenaga_kependidikan', '/app/absensi-siswa'), false);
});

test('student and user input validation rejects invalid data', () => {
  assert.ok(validateStudentInput({ nis: '', name: 'Budi', className: 'X TKJ 1' }));
  assert.ok(validateStudentInput({ nis: '12', name: 'Budi', className: 'X TKJ 1' }));
  assert.equal(validateStudentInput({ nis: '2026001', name: 'Budi Santoso', className: 'X TKJ 1' }), null);

  assert.ok(validateUserInput({ email: 'bad-email', fullName: 'Ani', password: 'secret', role: 'guru' }, true));
  assert.ok(validateUserInput({ email: 'ani@smk.id', fullName: 'Ani', password: '123', role: 'guru' }, true));
  assert.equal(validateUserInput({ email: 'ani@smk.id', fullName: 'Ani Wijaya', password: '', role: 'guru' }, false), null);
});

test('attendance summary and CSV formatting compute accurate outputs', () => {
  const empSummary = summarizeEmployeeAttendance([
    {
      id: '1',
      userId: 'u1',
      userName: 'Siti Aminah',
      userEmail: 'siti@smk.id',
      userRole: 'guru',
      nip: '19880101',
      date: '2026-11-18',
      status: 'Hadir',
      checkInTime: '2026-11-18T07:05:00.000Z',
      checkOutTime: null,
      notes: '',
    },
    {
      id: '2',
      userId: 'u2',
      userName: 'Dedi Kurniawan',
      userEmail: 'dedi@smk.id',
      userRole: 'tenaga_kependidikan',
      nip: '19900202',
      date: '2026-11-18',
      status: 'Izin',
      checkInTime: '2026-11-18T07:10:00.000Z',
      checkOutTime: null,
      notes: 'Urusan keluarga',
    },
  ]);
  assert.deepEqual(empSummary, { total: 2, hadir: 1, izin: 1, sakit: 0 });

  const stuSummary = summarizeStudentAttendance([
    {
      id: 's1',
      studentId: 'st1',
      studentNis: '20261001',
      studentName: 'Raka Pratama',
      className: 'X TKJ 1',
      date: '2026-11-18',
      status: 'Hadir',
      notes: '',
      recordedById: 'u1',
      recordedByName: 'Siti Aminah',
      updatedAt: '2026-11-18T07:30:00.000Z',
    },
    {
      id: 's2',
      studentId: 'st2',
      studentNis: '20261002',
      studentName: 'Nadia Putri',
      className: 'X TKJ 1',
      date: '2026-11-18',
      status: 'Alpha',
      notes: '',
      recordedById: 'u1',
      recordedByName: 'Siti Aminah',
      updatedAt: '2026-11-18T07:30:00.000Z',
    },
  ]);
  assert.deepEqual(stuSummary, { total: 2, hadir: 1, izin: 0, sakit: 0, alpha: 1 });

  const empCsv = formatEmployeeRecapCsv([
    {
      id: '1',
      userId: 'u1',
      userName: 'Siti Aminah',
      userEmail: 'siti@smk.id',
      userRole: 'guru',
      nip: '19880101',
      date: '2026-11-18',
      status: 'Hadir',
      checkInTime: '2026-11-18T07:05:00.000Z',
      checkOutTime: null,
      notes: '',
    },
  ]);
  assert.ok(empCsv.includes('"Siti Aminah"'));
  assert.ok(empCsv.includes('"Guru"'));

  const stuCsv = formatStudentRecapCsv([
    {
      id: 's1',
      studentId: 'st1',
      studentNis: '20261001',
      studentName: 'Raka Pratama',
      className: 'X TKJ 1',
      date: '2026-11-18',
      status: 'Hadir',
      notes: '',
      recordedById: 'u1',
      recordedByName: 'Siti Aminah',
      updatedAt: '2026-11-18T07:30:00.000Z',
    },
  ]);
  assert.ok(stuCsv.includes('"20261001"'));
  assert.ok(stuCsv.includes('"Raka Pratama"'));
});
