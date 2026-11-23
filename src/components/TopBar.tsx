import { LogOut, Menu } from 'lucide-react';
import type { UserProfile } from '../types';
import { formatRoleLabel } from '../utils/attendanceLogic';

interface TopBarProps {
  user: UserProfile;
  pageTitle: string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export function TopBar({ user, pageTitle, onOpenMobileMenu, onLogout }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/80 bg-white/70 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-[0_4px_20px_-8px_rgba(2,132,199,0.16)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu samping"
          className="rounded-xl p-2 text-slate-700 hover:bg-white/80 hover:text-slate-950 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-sky-800/80">
            <span>Portal Absensi</span>
            <span aria-hidden="true">/</span>
            <span className="truncate font-semibold text-sky-900">{pageTitle}</span>
          </div>
          <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Top Right Account & Logout Button */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold text-slate-900 leading-tight">{user.fullName}</p>
          <p className="text-xs font-medium text-sky-800 leading-tight mt-0.5">
            {formatRoleLabel(user.role)}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="aero-btn-danger inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap shrink-0"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
