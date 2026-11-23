import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { AeroBackdrop } from '../components/AeroBackdrop';
import { canAccessPath } from '../utils/attendanceLogic';
import { DashboardView } from './app/DashboardView';
import { EmployeeAttendanceView } from './app/EmployeeAttendanceView';
import { StudentAttendanceView } from './app/StudentAttendanceView';
import { EmployeeRecapView } from './app/EmployeeRecapView';
import { StudentRecapView } from './app/StudentRecapView';
import { StudentDataView } from './app/StudentDataView';
import { UserManagementView } from './app/UserManagementView';

function resolvePageTitle(pathname: string): string {
  if (pathname.includes('/absensi-karyawan')) return 'Absensi Karyawan';
  if (pathname.includes('/absensi-siswa')) return 'Absensi Siswa';
  if (pathname.includes('/rekap/karyawan')) return 'Rekap Absensi Karyawan';
  if (pathname.includes('/rekap/siswa')) return 'Rekap Absensi Siswa';
  if (pathname.includes('/data-siswa')) return 'Data Siswa';
  if (pathname.includes('/users')) return 'User Management';
  return 'Dashboard';
}

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-sm font-semibold text-sky-900">
        <AeroBackdrop subtle />
        <div className="liquid-glass rounded-2xl px-6 py-4">Memuat sesi pengguna...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const section = params.section || 'dashboard';
  const subsection = params.subsection || '';
  const currentPath = subsection ? `/app/${section}/${subsection}` : `/app/${section}`;

  if (!canAccessPath(user.role, currentPath)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function renderDynamicSection() {
    if (section === 'dashboard') return <DashboardView />;
    if (section === 'absensi-karyawan') return <EmployeeAttendanceView />;
    if (section === 'absensi-siswa') return <StudentAttendanceView />;
    if (section === 'rekap' && subsection === 'karyawan') return <EmployeeRecapView />;
    if (section === 'rekap' && subsection === 'siswa') return <StudentRecapView />;
    if (section === 'data-siswa') return <StudentDataView />;
    if (section === 'users') return <UserManagementView />;
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen text-slate-900">
      <AeroBackdrop subtle />

      <Sidebar
        role={user.role}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <TopBar
          user={user}
          pageTitle={resolvePageTitle(location.pathname)}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-6xl"
          >
            {renderDynamicSection()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
