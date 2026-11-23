import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { EmployeeAttendanceRecord, EmployeeAttendanceStatus } from '../../types';
import { formatRoleLabel, formatTimeShort, getTodayDateISO } from '../../utils/attendanceLogic';
import { AttendanceStatusText } from '../../components/StatusText';

export function EmployeeAttendanceView() {
  const { user } = useAuth();
  const [records, setRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<EmployeeAttendanceStatus>('Hadir');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString('id-ID', { hour12: false }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setClockText(new Date().toLocaleTimeString('id-ID', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadMyRecords = useCallback(async () => {
    try {
      const res = await api.getEmployeeAttendance({ scope: 'me' });
      setRecords(res.records);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memuat riwayat absensi.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyRecords();
  }, [loadMyRecords]);

  const todayIso = getTodayDateISO();
  const todayRecord = records.find((r) => r.date === todayIso) || null;

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.employeeCheckIn(status, notes);
      setNotes('');
      await loadMyRecords();
      setFeedback({ type: 'success', text: 'Kehadiran masuk berhasil dicatat.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mencatat kehadiran.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut() {
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.employeeCheckOut();
      await loadMyRecords();
      setFeedback({ type: 'success', text: 'Jam pulang berhasil dicatat.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mencatat jam pulang.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Self Attendance Liquid Glass Card */}
      <section className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 border-b border-sky-900/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-sky-700">
              Presensi Mandiri Karyawan · {formatRoleLabel(user.role)}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">{user.fullName}</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {user.positionTitle || 'Civitas SMK Prima Unggul'} · NIP:{' '}
              <span className="font-mono">{user.nip || '—'}</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold text-slate-600">Tanggal: {todayIso}</p>
            <p className="mt-0.5 font-mono text-2xl font-extrabold text-sky-800 tabular-nums">
              {clockText}
            </p>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                : 'border-rose-200 bg-rose-50/90 text-rose-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {!todayRecord ? (
          <form onSubmit={handleCheckIn} className="mt-6 space-y-5">
            <div>
              <span className="block text-sm font-semibold text-slate-800">Status Kehadiran</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['Hadir', 'Izin', 'Sakit'] as EmployeeAttendanceStatus[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      status === option ? 'aero-btn-primary' : 'aero-btn-glass'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="emp-notes" className="block text-sm font-semibold text-slate-800">
                Catatan / Keterangan (Opsional)
              </label>
              <input
                id="emp-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Mengajar kelas X TKJ 1, atau keterangan izin/sakit"
                className="aero-input mt-1.5 w-full max-w-xl rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="aero-btn-emerald inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{submitting ? 'Menyimpan...' : 'Catat Kehadiran (Masuk)'}</span>
            </button>
          </form>
        ) : (
          <div className="liquid-glass-subtle mt-6 flex flex-col gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <span>Presensi Hari Ini Sudah Tercatat</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                <span>
                  Status: <strong className="text-slate-900">{todayRecord.status}</strong>
                </span>
                <span>
                  Jam Masuk:{' '}
                  <strong className="font-mono text-slate-900 tabular-nums">
                    {formatTimeShort(todayRecord.checkInTime)}
                  </strong>
                </span>
                <span>
                  Jam Pulang:{' '}
                  <strong className="font-mono text-slate-900 tabular-nums">
                    {todayRecord.checkOutTime
                      ? formatTimeShort(todayRecord.checkOutTime)
                      : 'Belum dicatat'}
                  </strong>
                </span>
              </div>
              {todayRecord.notes && (
                <p className="text-xs text-slate-600">Catatan: {todayRecord.notes}</p>
              )}
            </div>

            {!todayRecord.checkOutTime ? (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={submitting}
                className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitting ? 'Menyimpan...' : 'Catat Kepulangan (Pulang)'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 shrink-0">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Presensi Hari Ini Selesai</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Personal Attendance Log */}
      <section className="liquid-glass rounded-2xl overflow-hidden">
        <div className="border-b border-sky-900/10 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Riwayat Absensi Karyawan Saya</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Jam Masuk</th>
                <th className="px-5 py-3">Jam Pulang</th>
                <th className="px-5 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Memuat data presensi...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Belum ada riwayat presensi karyawan.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {rec.date}
                    </td>
                    <td className="px-5 py-3">
                      <AttendanceStatusText status={rec.status} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatTimeShort(rec.checkInTime)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatTimeShort(rec.checkOutTime)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{rec.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
