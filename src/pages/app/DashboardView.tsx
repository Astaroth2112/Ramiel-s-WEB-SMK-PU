import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { DashboardSummary } from '../../types';
import { formatRoleLabel, formatTimeShort } from '../../utils/attendanceLogic';
import { AttendanceStatusText } from '../../components/StatusText';

export function DashboardView() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await api.dashboardSummary();
        if (active) setSummary(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="liquid-glass h-28 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="liquid-glass h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-6 text-sm font-medium text-rose-800 backdrop-blur-md">
        {error || 'Data dashboard tidak tersedia.'}
      </div>
    );
  }

  const myAtt = summary.myTodayAttendance;

  return (
    <div className="space-y-7">
      {/* Greeting & Personal Check-in Liquid Glass Banner */}
      <section className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-sky-700">
              {formatRoleLabel(user.role)} · {summary.todayDate}
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Selamat Datang, {user.fullName}
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              {myAtt
                ? `Status presensi Anda hari ini: ${myAtt.status} (Masuk pukul ${formatTimeShort(myAtt.checkInTime)}${myAtt.checkOutTime ? `, Pulang pukul ${formatTimeShort(myAtt.checkOutTime)}` : ''}).`
                : 'Anda belum mencatat kehadiran karyawan untuk hari ini.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/app/absensi-karyawan"
              className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
            >
              {myAtt ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{myAtt ? 'Lihat Absensi Saya' : 'Catat Absensi Hari Ini'}</span>
            </Link>

            {(user.role === 'admin' || user.role === 'guru') && (
              <Link
                to="/app/absensi-siswa"
                className="aero-btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                <span>Absensi Siswa</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Role-Specific KPI Strip */}
      <section aria-label="Ringkasan Statistik">
        {user.role === 'tenaga_kependidikan' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Status Hari Ini</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {myAtt ? myAtt.status : 'Belum Absen'}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Jam Masuk</p>
              <p className="mt-2 font-mono text-2xl font-extrabold text-sky-700 tabular-nums">
                {myAtt ? formatTimeShort(myAtt.checkInTime) : '—'}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Jam Pulang</p>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
                {myAtt?.checkOutTime ? formatTimeShort(myAtt.checkOutTime) : '—'}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Riwayat Tercatat</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700 tabular-nums">
                {summary.recentEmployeeLogs.length} Hari
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Total Karyawan</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.totalEmployees}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Karyawan Hadir Hari Ini</p>
              <p className="mt-2 text-2xl font-extrabold text-sky-700 tabular-nums">
                {summary.employeesPresentToday}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Total Siswa Terdaftar</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.totalStudents}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-600">Siswa Hadir Hari Ini</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700 tabular-nums">
                {summary.studentsPresentToday}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="liquid-glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-sky-900/10 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">
              {user.role === 'admin' ? 'Aktivitas Absensi Karyawan Terbaru' : 'Riwayat Presensi Saya'}
            </h3>
            <Link
              to={user.role === 'admin' ? '/app/rekap/karyawan' : '/app/absensi-karyawan'}
              className="text-xs font-bold text-sky-700 hover:underline"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-900/10">
                {summary.recentEmployeeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      Belum ada catatan kehadiran karyawan.
                    </td>
                  </tr>
                ) : (
                  summary.recentEmployeeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                        {log.date}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.userName}</td>
                      <td className="px-4 py-3">
                        <AttendanceStatusText status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums">
                        {formatTimeShort(log.checkInTime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {(user.role === 'admin' || user.role === 'guru') && (
          <section className="liquid-glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-sky-900/10 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">Absensi Siswa Terbaru</h3>
              <Link to="/app/rekap/siswa" className="text-xs font-bold text-sky-700 hover:underline">
                Lihat Rekap
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-900/10">
                  {summary.recentStudentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        Belum ada pencatatan absensi siswa.
                      </td>
                    </tr>
                  ) : (
                    summary.recentStudentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                          {log.date}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{log.studentName}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">{log.className}</td>
                        <td className="px-4 py-3">
                          <AttendanceStatusText status={log.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
