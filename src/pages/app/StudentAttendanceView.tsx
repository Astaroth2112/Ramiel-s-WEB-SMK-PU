import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck, Save } from 'lucide-react';
import { api } from '../../lib/api';
import type { Student, StudentAttendanceStatus } from '../../types';
import { CLASS_LIST, getTodayDateISO } from '../../utils/attendanceLogic';

interface DraftEntry {
  status: StudentAttendanceStatus;
  notes: string;
}

const STATUS_OPTIONS: StudentAttendanceStatus[] = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

export function StudentAttendanceView() {
  const [date, setDate] = useState(getTodayDateISO());
  const [selectedClass, setSelectedClass] = useState('X TKJ 1');
  const [students, setStudents] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableClasses = useMemo(() => {
    const fromStudents = Array.from(new Set(students.map((s) => s.className)));
    return Array.from(new Set([...CLASS_LIST, ...fromStudents])).sort();
  }, [students]);

  const loadRosterAndAttendance = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [stuRes, attRes] = await Promise.all([
        api.getStudents(),
        api.getStudentAttendance({ date, className: selectedClass }),
      ]);
      setStudents(stuRes.students);

      const classStudents = stuRes.students.filter((s) => s.className === selectedClass);
      const existingMap = new Map(attRes.records.map((r) => [r.studentId, r]));

      const nextDrafts: Record<string, DraftEntry> = {};
      for (const st of classStudents) {
        const existing = existingMap.get(st.id);
        nextDrafts[st.id] = {
          status: existing ? existing.status : 'Hadir',
          notes: existing ? existing.notes : '',
        };
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memuat daftar siswa.',
      });
    } finally {
      setLoading(false);
    }
  }, [date, selectedClass]);

  useEffect(() => {
    void loadRosterAndAttendance();
  }, [loadRosterAndAttendance]);

  const filteredStudents = useMemo(
    () => students.filter((s) => s.className === selectedClass),
    [students, selectedClass],
  );

  function updateEntry(studentId: string, patch: Partial<DraftEntry>) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'Hadir',
        notes: prev[studentId]?.notes || '',
        ...patch,
      },
    }));
  }

  function markAllPresent() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const st of filteredStudents) {
        next[st.id] = {
          status: 'Hadir',
          notes: next[st.id]?.notes || '',
        };
      }
      return next;
    });
  }

  async function handleSave() {
    if (filteredStudents.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const entries = filteredStudents.map((st) => ({
        studentId: st.id,
        status: drafts[st.id]?.status || 'Hadir',
        notes: drafts[st.id]?.notes || '',
      }));
      const res = await api.saveStudentAttendanceBatch(date, entries);
      setFeedback({
        type: 'success',
        text: `Berhasil menyimpan absensi ${res.savedCount} siswa kelas ${selectedClass} (${date}).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan absensi siswa.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter & Action Toolbar */}
      <section className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="att-date" className="block text-xs font-semibold text-slate-600">
                Tanggal Absensi
              </label>
              <input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="att-class" className="block text-xs font-semibold text-slate-600">
                Pilih Kelas
              </label>
              <select
                id="att-class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={markAllPresent}
              disabled={filteredStudents.length === 0 || saving}
              className="aero-btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tandai Semua Hadir</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={filteredStudents.length === 0 || saving}
              className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Absensi Kelas'}</span>
            </button>
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
      </section>

      {/* Student Roster Table */}
      <section className="liquid-glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-sky-900/10 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Daftar Siswa Kelas {selectedClass}
          </h2>
          <span className="text-xs font-semibold text-sky-800 tabular-nums">
            {filteredStudents.length} Siswa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">NIS</th>
                <th className="px-5 py-3">Nama Siswa</th>
                <th className="px-5 py-3">Status Kehadiran</th>
                <th className="px-5 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                    Belum ada siswa terdaftar di kelas {selectedClass}. Admin dapat menambahkan siswa
                    di menu Data Siswa.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const currentStatus = drafts[st.id]?.status || 'Hadir';
                  const currentNotes = drafts[st.id]?.notes || '';
                  return (
                    <tr key={st.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                        {st.nis}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{st.name}</td>
                      <td className="px-5 py-3">
                        <div
                          className="inline-flex rounded-xl border border-sky-200/70 bg-sky-100/55 p-1 gap-1"
                          role="group"
                          aria-label={`Status absensi ${st.name}`}
                        >
                          {STATUS_OPTIONS.map((opt) => {
                            const active = currentStatus === opt;
                            let activeStyle = 'bg-white text-slate-900 shadow-sm';
                            if (active && opt === 'Hadir')
                              activeStyle = 'aero-btn-emerald';
                            else if (active && opt === 'Izin')
                              activeStyle = 'bg-amber-600 text-white shadow-sm';
                            else if (active && opt === 'Sakit')
                              activeStyle = 'aero-btn-primary';
                            else if (active && opt === 'Alpha')
                              activeStyle = 'aero-btn-danger';

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => updateEntry(st.id, { status: opt })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                                  active ? activeStyle : 'text-slate-700 hover:text-slate-950'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          aria-label={`Catatan untuk ${st.name}`}
                          value={currentNotes}
                          onChange={(e) => updateEntry(st.id, { notes: e.target.value })}
                          placeholder="Keterangan opsional"
                          className="aero-input w-full min-w-[180px] rounded-xl px-3 py-1.5 text-xs text-slate-800"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
