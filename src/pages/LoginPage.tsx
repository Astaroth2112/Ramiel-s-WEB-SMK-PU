import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AeroBackdrop } from '../components/AeroBackdrop';

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@smkprimaunggul.sch.id',
    password: 'Password123!',
    hint: 'Akses Penuh',
  },
  {
    label: 'Guru',
    email: 'guru@smkprimaunggul.sch.id',
    password: 'Password123!',
    hint: 'Karyawan & Siswa',
  },
  {
    label: 'Tendik',
    email: 'tendik@smkprimaunggul.sch.id',
    password: 'Password123!',
    hint: 'Absensi Karyawan',
  },
];

export function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, fullName, nip, positionTitle, password });
      }
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses akun.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(demoEmail: string, demoPassword: string) {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk dengan akun demo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-12 text-slate-900">
      <AeroBackdrop />

      {/* Left Oceanic Aqua Visual Panel */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-sky-950 text-white p-10">
        {!imgError && (
          <img
            src="/src/assets/images/hero_smk_campus_1795061650240.jpg"
            alt="Kampus SMK Prima Unggul"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(155deg, rgba(3, 105, 161, 0.85) 0%, rgba(12, 74, 110, 0.82) 55%, rgba(6, 78, 59, 0.86) 100%)',
          }}
        />

        {/* Ambient glossy bubbles inside left panel */}
        <div
          aria-hidden="true"
          className="aero-bubble animate-aero-slow pointer-events-none absolute -top-12 -right-12 h-48 w-48 opacity-45"
        />
        <div
          aria-hidden="true"
          className="aero-bubble animate-aero-drift pointer-events-none absolute bottom-16 -left-10 h-36 w-36 opacity-40"
        />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Beranda Sekolah</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-xs font-bold tracking-wide text-sky-200">SMK Prima Unggul</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight leading-tight">
            Portal Absensi Karyawan &amp; Siswa Terintegrasi
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sky-100">
            Sistem pencatatan kehadiran harian untuk Administrator, Guru, dan Tenaga Kependidikan
            di seluruh jurusan TKJ, DKV, BC, AK, MPLB, dan BD.
          </p>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-5 text-xs text-sky-100/90">
          Akun pertama yang didaftarkan otomatis ditetapkan sebagai Administrator sistem.
        </div>
      </div>

      {/* Right Liquid Glass Auth Form Panel */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:col-span-7 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass mx-auto w-full max-w-md rounded-3xl p-7 sm:p-9"
        >
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Beranda</span>
            </Link>
            <span className="text-sm font-bold text-slate-900">SMK Prima Unggul</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {mode === 'login' ? 'Masuk ke Portal Absensi' : 'Pendaftaran Akun Baru'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {mode === 'login'
                ? 'Gunakan email institusi dan kata sandi Anda untuk mengakses /app.'
                : 'Daftarkan akun karyawan baru. User pertama pada sistem otomatis mendapat role Admin.'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-sky-200/70 bg-sky-100/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-slate-800">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Rahmat Hidayat, S.Pd."
                    className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nip" className="block text-sm font-semibold text-slate-800">
                      NIP / NUPTK
                    </label>
                    <input
                      id="nip"
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="199001012020121001"
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="positionTitle"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Jabatan
                    </label>
                    <input
                      id="positionTitle"
                      type="text"
                      value={positionTitle}
                      onChange={(e) => setPositionTitle(e.target.value)}
                      placeholder="Staf / Guru"
                      className="aero-input mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                Email Institusi
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@smkprimaunggul.sch.id"
                  className="aero-input w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                Kata Sandi
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="aero-input w-full rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="aero-btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {mode === 'login' ? (
                <LogIn className="h-4 w-4" aria-hidden="true" />
              ) : (
                <UserPlus className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {submitting
                  ? 'Memproses...'
                  : mode === 'login'
                    ? 'Masuk ke /app'
                    : 'Daftar & Masuk'}
              </span>
            </button>
          </form>

          {/* Quick Role Demo Access */}
          <div className="mt-7 border-t border-sky-900/10 pt-5">
            <p className="text-xs font-semibold text-slate-600">
              Akses Cepat Akun Demo (Kata sandi: Password123!)
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin(acc.email, acc.password)}
                  className="aero-btn-glass rounded-xl px-3 py-2 text-left"
                >
                  <p className="text-xs font-bold text-sky-800">{acc.label}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-600">{acc.hint}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
