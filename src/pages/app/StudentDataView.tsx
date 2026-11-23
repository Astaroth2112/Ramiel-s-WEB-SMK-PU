import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../../lib/api';
import type { Student } from '../../types';
import { CLASS_LIST } from '../../utils/attendanceLogic';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export function StudentDataView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('X TKJ 1');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({ search, className: classFilter });
      setStudents(res.students);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memuat data siswa.',
      });
    } finally {
      setLoading(false);
    }
  }, [search, classFilter]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  function openCreateModal() {
    setEditingStudent(null);
    setNis('');
    setName('');
    setClassName('X TKJ 1');
    setModalError(null);
    setModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setNis(student.nis);
    setName(student.name);
    setClassName(student.className);
    setModalError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, { nis, name, className });
        setFeedback({ type: 'success', text: `Data siswa ${name} berhasil diperbarui.` });
      } else {
        await api.createStudent({ nis, name, className });
        setFeedback({ type: 'success', text: `Siswa ${name} berhasil ditambahkan.` });
      }
      setModalOpen(false);
      await loadStudents();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan data siswa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteStudent(deleteTarget.id);
      setFeedback({ type: 'success', text: `Data siswa ${deleteTarget.name} telah dihapus.` });
      setDeleteTarget(null);
      await loadStudents();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menghapus data siswa.',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <section className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 flex-1 max-w-xl">
            <div>
              <label htmlFor="data-stu-search" className="block text-xs font-semibold text-slate-600">
                Cari NIS / Nama Siswa
              </label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                  aria-hidden="true"
                />
                <input
                  id="data-stu-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ketik NIS atau nama..."
                  className="aero-input w-full rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="data-stu-class" className="block text-xs font-semibold text-slate-600">
                Filter Kelas
              </label>
              <select
                id="data-stu-class"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="aero-input mt-1.5 w-full rounded-xl px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Semua Kelas</option>
                {CLASS_LIST.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Tambah Siswa</span>
          </button>
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

      {/* Table */}
      <section className="liquid-glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-sky-900/10 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Master Data Siswa</h2>
          <span className="text-xs font-semibold text-sky-800 tabular-nums">
            {students.length} Siswa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">NIS</th>
                <th className="px-5 py-3">Nama Lengkap</th>
                <th className="px-5 py-3">Kelas</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Memuat master data siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Belum ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {st.nis}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{st.name}</td>
                    <td className="px-5 py-3 text-slate-700">{st.className}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(st)}
                          aria-label={`Edit ${st.name}`}
                          className="aero-btn-glass inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(st)}
                          aria-label={`Hapus ${st.name}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/90 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit Student Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass w-full max-w-md rounded-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-sky-900/10 pb-4">
                <h3 id="student-modal-title" className="text-base font-bold text-slate-900">
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Tutup form siswa"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white/70 hover:text-slate-900"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {modalError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-medium text-rose-800"
                >
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="stu-nis" className="block text-sm font-semibold text-slate-800">
                    NIS
                  </label>
                  <input
                    id="stu-nis"
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 20261010"
                    className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="stu-name" className="block text-sm font-semibold text-slate-800">
                    Nama Lengkap
                  </label>
                  <input
                    id="stu-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap siswa"
                    className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stu-classname"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Kelas
                  </label>
                  <select
                    id="stu-classname"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                  >
                    {CLASS_LIST.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="aero-btn-glass rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="aero-btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Data Siswa?"
        description={`Data siswa "${deleteTarget?.name}" (NIS: ${deleteTarget?.nis}) beserta riwayat absensinya akan dihapus secara permanen.`}
        confirmLabel="Hapus Siswa"
        destructive
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
