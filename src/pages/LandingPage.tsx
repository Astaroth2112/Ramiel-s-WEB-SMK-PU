import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Building2, CheckCircle2, ClipboardCheck, ShieldCheck, Users } from 'lucide-react';
import { SCHOOL_CLUSTERS } from '../utils/attendanceLogic';
import { AeroBackdrop } from '../components/AeroBackdrop';

export function LandingPage() {
  const [heroImgError, setHeroImgError] = useState(false);
  const [labImgError, setLabImgError] = useState(false);
  const [studioImgError, setStudioImgError] = useState(false);

  return (
    <div className="relative min-h-screen text-slate-900">
      <AeroBackdrop />

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/65 backdrop-blur-xl shadow-[0_6px_24px_-10px_rgba(2,132,199,0.2)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
          <Link
            to="/"
            className="text-lg font-extrabold tracking-tight text-sky-800 whitespace-nowrap shrink-0"
          >
            SMK Prima Unggul
          </Link>

          <nav
            aria-label="Navigasi Profil Sekolah"
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700"
          >
            <a href="#profil" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Profil Sekolah
            </a>
            <a href="#jurusan" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Kompetensi Keahlian
            </a>
            <a href="#sistem-absensi" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Sistem Absensi
            </a>
            <a href="#kontak" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Kontak
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              to="/login"
              className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="profil" className="mx-auto max-w-7xl px-6 pt-12 pb-14 lg:pt-16 lg:pb-18">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass flex flex-col justify-center rounded-3xl p-7 sm:p-10 lg:col-span-6"
            >
              <p className="text-xs font-bold tracking-wide text-sky-700">
                Sekolah Menengah Kejuruan Terakreditasi A · Jakarta &amp; Tangerang
              </p>
              <h1
                className="mt-3 font-extrabold tracking-tight text-slate-900 leading-[1.12]"
                style={{ fontSize: 'clamp(2.15rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
              >
                Mencetak Lulusan Vokasi Siap Kerja, Kreatif, dan Berintegritas.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700">
                SMK Prima Unggul adalah institusi pendidikan kejuruan berbasis industri yang
                memadukan kurikulum praktik modern, sertifikasi kompetensi nasional, serta tata
                kelola kehadiran siswa dan tenaga pendidik secara digital dan transparan.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="aero-btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold whitespace-nowrap shrink-0"
                >
                  <span>Buka Aplikasi Absensi</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
                <a
                  href="#jurusan"
                  className="aero-btn-glass inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap shrink-0"
                >
                  Lihat 6 Kompetensi Keahlian
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sky-900/10 pt-5 text-xs font-semibold text-slate-600">
                <span>Kurikulum Merdeka Vokasi</span>
                <span aria-hidden="true">·</span>
                <span>3 Bidang Keahlian Utama</span>
                <span aria-hidden="true">·</span>
                <span>6 Konsentrasi Industri</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="liquid-glass relative h-72 w-full overflow-hidden rounded-3xl p-2 sm:h-96 lg:h-full lg:min-h-[430px]">
                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                  {!heroImgError ? (
                    <img
                      src="/src/assets/images/hero_smk_campus_1795061650240.jpg"
                      alt="Gedung kampus modern SMK Prima Unggul dengan siswa berjalan di halaman sekolah"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-emerald-50 p-8 text-center">
                      <Building2 className="h-12 w-12 text-sky-700" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Kampus Terpadu SMK Prima Unggul
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* 4-Column Liquid Glass Proof Strip */}
          <div className="liquid-glass mt-8 grid grid-cols-2 gap-4 rounded-2xl p-6 md:grid-cols-4">
            <div>
              <p className="text-2xl font-extrabold text-sky-700 tabular-nums">3 Bidang</p>
              <p className="mt-1 text-sm font-medium text-slate-700">Rumpun Jurusan Terstruktur</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">6 Program</p>
              <p className="mt-1 text-sm font-medium text-slate-700">TKJ, DKV, BC, AK, MPLB &amp; BD</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">94%</p>
              <p className="mt-1 text-sm font-medium text-slate-700">Serapan Industri &amp; Wirausaha</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-sky-700 tabular-nums">100%</p>
              <p className="mt-1 text-sm font-medium text-slate-700">Pencatatan Kehadiran Real-Time</p>
            </div>
          </div>
        </section>

        {/* 3 Jurusan / 6 Kompetensi Keahlian Section */}
        <section id="jurusan" className="py-14 lg:py-18">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-wide text-sky-700">
                Program Pendidikan Vokasi
              </p>
              <h2
                className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900"
                style={{ textWrap: 'balance' }}
              >
                3 Bidang Keahlian dengan 6 Kompetensi Unggulan
              </h2>
              <p className="mt-3 text-base text-slate-700">
                SMK Prima Unggul mengorganisasikan tiga rumpun jurusan utama yang menaungi enam
                kompetensi keahlian spesifik: TKJ, DKV, BC, AK, MPLB, dan BD.
              </p>
            </div>

            <div className="mt-10 space-y-6">
              {SCHOOL_CLUSTERS.map((cluster) => (
                <div
                  key={cluster.clusterNumber}
                  className="liquid-glass rounded-3xl p-6 sm:p-8"
                >
                  <div className="flex flex-col gap-2 border-b border-sky-900/10 pb-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700">
                        Jurusan {cluster.clusterNumber}
                      </p>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                        {cluster.clusterNumber}. {cluster.clusterTitle}
                      </h3>
                    </div>
                    <p className="max-w-md text-sm text-slate-700">{cluster.clusterSummary}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {cluster.competencies.map((comp) => (
                      <div
                        key={comp.code}
                        className="liquid-glass-subtle flex flex-col justify-between rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-extrabold text-sky-700">
                              {comp.code}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              Kompetensi Keahlian
                            </span>
                          </div>
                          <h4 className="mt-2 text-base font-bold text-slate-900">{comp.name}</h4>
                          <p className="mt-2 text-sm leading-relaxed text-slate-700">{comp.focus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Facility Proof Visuals */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="liquid-glass overflow-hidden rounded-3xl p-2.5">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sky-100">
                  {!labImgError ? (
                    <img
                      src="/src/assets/images/vocational_tech_lab_1795061650214.jpg"
                      alt="Laboratorium praktik TKJ dan DKV SMK Prima Unggul"
                      referrerPolicy="no-referrer"
                      onError={() => setLabImgError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-sky-50 text-sm text-slate-600">
                      Laboratorium TKJ &amp; DKV
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold text-sky-700">Fasilitas Praktik TKJ &amp; DKV</p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    Laboratorium Jaringan Fiber Optik &amp; Studio Desain Digital
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-700">
                    Dilengkapi rak server industri, perangkat routing terkelola, serta workstation
                    desain berkalibrasi warna.
                  </p>
                </div>
              </div>

              <div className="liquid-glass overflow-hidden rounded-3xl p-2.5">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sky-100">
                  {!studioImgError ? (
                    <img
                      src="/src/assets/images/vocational_broadcast_studio_1795061650002.jpg"
                      alt="Studio Broadcasting dan Bisnis Digital SMK Prima Unggul"
                      referrerPolicy="no-referrer"
                      onError={() => setStudioImgError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-sky-50 text-sm text-slate-600">
                      Studio Broadcasting &amp; Bisnis Digital
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold text-emerald-700">
                    Fasilitas Praktik BC, AK, MPLB &amp; BD
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    Studio Penyiaran &amp; Inkubator Bisnis Digital
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-700">
                    Mendukung produksi siaran multi-kamera, simulasi kantor modern, laboratorium
                    akuntansi, dan perdagangan digital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attendance System Workflow Section */}
        <section id="sistem-absensi" className="py-14 lg:py-18">
          <div className="mx-auto max-w-7xl px-6">
            <div className="liquid-glass rounded-3xl p-7 sm:p-10">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-5">
                  <p className="text-xs font-bold text-sky-700">Sistem Informasi Kehadiran</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    Satu Portal Absensi untuk Karyawan dan Siswa
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-slate-700">
                    Seluruh civitas akademika SMK Prima Unggul terhubung dalam satu sistem kehadiran
                    terintegrasi dengan pembagian hak akses yang jelas dan rekapitulasi siap ekspor.
                  </p>
                  <div className="mt-7">
                    <Link
                      to="/login"
                      className="aero-btn-emerald inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
                    >
                      <span>Masuk ke Aplikasi</span>
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
                  <div className="liquid-glass-subtle rounded-2xl p-5">
                    <ShieldCheck className="h-6 w-6 text-sky-700" aria-hidden="true" />
                    <h3 className="mt-3 text-base font-bold text-slate-900">Admin</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      Mengelola akun pengguna tersinkronisasi autentikasi, master data siswa, serta
                      rekap absensi karyawan dan siswa.
                    </p>
                  </div>

                  <div className="liquid-glass-subtle rounded-2xl p-5">
                    <ClipboardCheck className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                    <h3 className="mt-3 text-base font-bold text-slate-900">Guru</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      Melakukan presensi karyawan mandiri, mencatat kehadiran siswa per kelas, dan
                      memantau rekap absensi siswa.
                    </p>
                  </div>

                  <div className="liquid-glass-subtle rounded-2xl p-5">
                    <Users className="h-6 w-6 text-sky-700" aria-hidden="true" />
                    <h3 className="mt-3 text-base font-bold text-slate-900">Tenaga Kependidikan</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      Mencatat jam masuk dan pulang harian secara mandiri serta melihat ringkasan
                      kehadiran pribadi di dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Frosted Footer */}
      <footer id="kontak" className="border-t border-white/80 bg-white/60 backdrop-blur-lg py-9">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">SMK Prima Unggul</p>
            <p className="mt-1 text-xs text-slate-600">
              Jl. Pendidikan Vokasi No. 88 · Telp. (021) 5550-1920 · info@smkprimaunggul.sch.id
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span>Terakreditasi A</span>
            </span>
            <Link to="/login" className="font-bold text-sky-700 hover:underline">
              Portal Absensi (/login)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
