import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../../lib/api';
import type { EmployeeAttendanceRecord } from '../../types';
import {
  formatEmployeeRecapCsv,
  formatRoleLabel,
  formatTimeShort,
  summarizeEmployeeAttendance,
} from '../../utils/attendanceLogic';
import { AttendanceStatusText } from '../../components/StatusText';

export function EmployeeRecapView() {
  const [records, setRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployeeAttendance({
        scope: 'all',
        startDate,
        endDate,
        role: roleFilter,
      });
      setRecords(res.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat rekap karyawan.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, roleFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = useMemo(() => summarizeEmployeeAttendance(records), [records]);

  function handleExportCsv() {
    const csv = formatEmployeeRecapCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-absensi-karyawan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <section className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="emp-start" className="block text-xs font-semibold text-slate-600">
                Dari Tanggal
              </label>
              <input
                id="emp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="aero-input mt-1.5 w-full rounded-xl px-3 py-2 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="emp-end" className="block text-xs font-semibold text-slate-600">
                Sampai Tanggal
              </label>
              <input
                id="emp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="aero-input mt-1.5 w-full rounded-xl px-3 py-2 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="emp-role" className="block text-xs font-semibold text-slate-600">
                Filter Role
              </label>
              <select
                id="emp-role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="aero-input mt-1.5 w-full rounded-xl px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Semua Role</option>
                <option value="admin">Administrator</option>
                <option value="guru">Guru</option>
                <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Summary Numbers */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-sky-900/10 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-slate-600">Total Catatan</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
              {summary.total}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Hadir</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700 tabular-nums">
              {summary.hadir}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Izin</p>
            <p className="mt-1 text-xl font-extrabold text-amber-700 tabular-nums">
              {summary.izin}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Sakit</p>
            <p className="mt-1 text-xl font-extrabold text-sky-700 tabular-nums">
              {summary.sakit}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-800">
          {error}
        </div>
      )}

      {/* Table */}
      <section className="liquid-glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Nama Karyawan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Jam Masuk</th>
                <th className="px-4 py-3">Jam Pulang</th>
                <th className="px-4 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Memuat data rekap karyawan...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada catatan absensi karyawan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {r.nip || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.userName}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {formatRoleLabel(r.userRole)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AttendanceStatusText status={r.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatTimeShort(r.checkInTime)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatTimeShort(r.checkOutTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.notes || '—'}</td>
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
