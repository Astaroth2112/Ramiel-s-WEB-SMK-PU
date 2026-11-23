import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type { UserRole } from '../types';
import { getMenusForRole } from '../utils/attendanceLogic';

interface SidebarProps {
  role: UserRole;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function getMenuIcon(id: string) {
  switch (id) {
    case 'dashboard':
      return LayoutDashboard;
    case 'absensi-karyawan':
      return UserCheck;
    case 'absensi-siswa':
      return ClipboardCheck;
    case 'rekap-absensi':
      return BarChart3;
    case 'data-siswa':
      return GraduationCap;
    case 'users':
      return Users;
    default:
      return FileSpreadsheet;
  }
}

export function Sidebar({ role, mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const menus = getMenusForRole(role);
  const isOnRekap = location.pathname.startsWith('/app/rekap');
  const [rekapExpanded, setRekapExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (isOnRekap) setRekapExpanded(true);
  }, [isOnRekap]);

  const navContent = (
    <div className="liquid-glass flex h-full flex-col rounded-none lg:rounded-r-2xl border-l-0 border-y-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-sky-900/10 px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="aero-btn-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm tracking-tight">
            PU
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900">
              SMK Prima Unggul
            </p>
            <p className="truncate text-xs font-medium text-sky-700">Sistem Absensi</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu samping"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white/70 lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Menu Utama" className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {menus.map((item) => {
          const Icon = getMenuIcon(item.id);
          if (item.children && item.children.length > 0) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setRekapExpanded((prev) => !prev)}
                  aria-expanded={rekapExpanded}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                    isOnRekap
                      ? 'bg-sky-100/80 text-sky-900 border border-sky-200/80'
                      : 'text-slate-700 hover:bg-white/65 hover:text-slate-950'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${isOnRekap ? 'text-sky-700' : 'text-slate-500'}`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      rekapExpanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence initial={false}>
                  {rekapExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="ml-4 space-y-1 border-l border-sky-200/80 pl-3"
                    >
                      {item.children.map((sub) => (
                        <NavLink
                          key={sub.id}
                          to={sub.path}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `block rounded-xl px-3 py-2 text-sm whitespace-nowrap ${
                              isActive
                                ? 'aero-btn-primary font-semibold'
                                : 'text-slate-700 hover:bg-white/70 hover:text-slate-950 font-medium'
                            }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path!}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap ${
                  isActive
                    ? 'aero-btn-primary font-semibold'
                    : 'text-slate-700 hover:bg-white/70 hover:text-slate-950 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer note inside sidebar */}
      <div className="border-t border-sky-900/10 px-5 py-3.5">
        <p className="text-xs font-medium text-slate-600">Tahun Ajaran 2026/2027</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-sky-950/35 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full w-64 max-w-[80vw]">{navContent}</aside>
        </div>
      )}
    </>
  );
}
