import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Search, Trash2, UserPlus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { UserProfile, UserRole } from '../../types';
import { formatRoleLabel } from '../../utils/attendanceLogic';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export function UserManagementView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [password, setPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memuat daftar user.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.nip.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, roleFilter, search]);

  function openCreateModal() {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setNip('');
    setPositionTitle('');
    setRole('guru');
    setPassword('');
    setModalError(null);
    setModalOpen(true);
  }

  function openEditModal(target: UserProfile) {
    setEditingUser(target);
    setFullName(target.fullName);
    setEmail(target.email);
    setNip(target.nip);
    setPositionTitle(target.positionTitle);
    setRole(target.role);
    setPassword('');
    setModalError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          email,
          fullName,
          nip,
          positionTitle,
          role,
          password: password || undefined,
        });
        setFeedback({
          type: 'success',
          text: `Data pengguna ${fullName} berhasil diperbarui dan disinkronkan.`,
        });
      } else {
        await api.createUser({
          email,
          fullName,
          nip,
          positionTitle,
          role,
          password,
        });
        setFeedback({
          type: 'success',
          text: `Pengguna baru ${fullName} berhasil ditambahkan dan disinkronkan ke Authentication.`,
        });
      }
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan data user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmHardDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setFeedback({
        type: 'success',
        text: `Pengguna ${deleteTarget.fullName} telah dihapus permanen (hard delete hingga Authentication).`,
      });
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menghapus pengguna.',
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
              <label htmlFor="usr-search" className="block text-xs font-semibold text-slate-600">
                Cari Nama / Email / NIP
              </label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                  aria-hidden="true"
                />
                <input
                  id="usr-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ketik nama atau email..."
                  className="aero-input w-full rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="usr-role-filter" className="block text-xs font-semibold text-slate-600">
                Filter Role
              </label>
              <select
                id="usr-role-filter"
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
            onClick={openCreateModal}
            className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Tambah User</span>
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

      {/* User Table */}
      <section className="liquid-glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-sky-900/10 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Akun Pengguna</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Seluruh perubahan akun disinkronkan langsung dengan sistem Authentication (termasuk hard delete).
            </p>
          </div>
          <span className="text-xs font-semibold text-sky-800 tabular-nums">
            {filteredUsers.length} Akun
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky-900/10 bg-sky-50/60 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada pengguna yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <span>{u.fullName}</span>
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-bold text-sky-700 whitespace-nowrap">
                            (Anda)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 break-all">{u.email}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {u.nip || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.positionTitle || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {formatRoleLabel(u.role)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            aria-label={`Edit ${u.fullName}`}
                            className="aero-btn-glass inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            aria-label={`Hapus ${u.fullName}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/90 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit User Modal */}
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
            aria-labelledby="user-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass w-full max-w-lg rounded-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-sky-900/10 pb-4">
                <h3 id="user-modal-title" className="text-base font-bold text-slate-900">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Tutup form pengguna"
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="usr-fullname"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="usr-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama lengkap beserta gelar"
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="usr-email" className="block text-sm font-semibold text-slate-800">
                      Email
                    </label>
                    <input
                      id="usr-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@smkprimaunggul.sch.id"
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="usr-nip" className="block text-sm font-semibold text-slate-800">
                      NIP / NUPTK
                    </label>
                    <input
                      id="usr-nip"
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="Opsional"
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="usr-position"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Jabatan
                    </label>
                    <input
                      id="usr-position"
                      type="text"
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      placeholder="Contoh: Guru Produktif DKV"
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="usr-role" className="block text-sm font-semibold text-slate-800">
                      Role Akses
                    </label>
                    <select
                      id="usr-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                    >
                      <option value="admin">Administrator</option>
                      <option value="guru">Guru</option>
                      <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="usr-password"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      {editingUser ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'}
                    </label>
                    <input
                      id="usr-password"
                      type="password"
                      required={!editingUser}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUser ? 'Kosongkan jika tetap' : 'Minimal 6 karakter'}
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>
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
                    {saving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hard Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Permanen Akun Pengguna?"
        description={`Akun "${deleteTarget?.fullName}" (${deleteTarget?.email}) akan dihapus secara permanen (hard delete) dari database dan sistem Authentication. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Permanen"
        destructive
        busy={deleting}
        onConfirm={handleConfirmHardDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
