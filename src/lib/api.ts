import { clientFallbackApi } from './clientFallbackApi';
import {
  ensureSupabaseConfigured,
  isSupabaseConfigured,
  supabase,
} from './supabaseClient';
import type {
  DashboardSummary,
  EmployeeAttendanceRecord,
  EmployeeAttendanceStatus,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceStatus,
  UserProfile,
  UserRole,
} from '../types';

const TOKEN_STORAGE_KEY = 'smk_prima_unggul_token';

let backendApiUnavailable = false;

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

async function withBackendOrFallback<T>(
  url: string,
  options: RequestInit,
  fallbackFn: (token: string | null) => Promise<T>,
  forceDirectSupabase = false,
): Promise<T> {
  const token = getStoredToken();

  if (forceDirectSupabase && !isSupabaseConfigured && !token?.startsWith('local-fallback:')) {
    await ensureSupabaseConfigured();
  }

  if (
    (forceDirectSupabase && isSupabaseConfigured && supabase) ||
    backendApiUnavailable ||
    token?.startsWith('local-fallback:')
  ) {
    return fallbackFn(token);
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, cache: 'no-store', headers });
  } catch {
    backendApiUnavailable = true;
    return fallbackFn(token);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    backendApiUnavailable = true;
    return fallbackFn(token);
  }

  const rawText = await res.text();
  let data: ({ error?: string } & T) | null = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText) as { error?: string } & T;
    } catch {
      data = null;
    }
  }

  if (res.status === 404 || res.status === 405 || res.status === 501 || res.status === 502 || res.status === 503) {
    if (!data?.error || data.error === 'Endpoint API tidak ditemukan.') {
      backendApiUnavailable = true;
      return fallbackFn(token);
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `Permintaan gagal (${res.status})`);
  }

  return (data || {}) as T;
}

export const api = {
  login(email: string, password: string) {
    return withBackendOrFallback<{ token: string; user: UserProfile; backend: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      () => clientFallbackApi.login(email, password),
      true,
    );
  },

  register(payload: {
    email: string;
    fullName: string;
    nip: string;
    positionTitle: string;
    password: string;
  }) {
    return withBackendOrFallback<{ token: string; user: UserProfile }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => clientFallbackApi.register(payload),
      true,
    );
  },

  me() {
    return withBackendOrFallback<{ user: UserProfile; backend: string }>(
      '/api/auth/me',
      {},
      (token) => clientFallbackApi.me(token),
      true,
    );
  },

  dashboardSummary() {
    return withBackendOrFallback<DashboardSummary>(
      '/api/dashboard/summary',
      {},
      (token) => clientFallbackApi.dashboardSummary(token),
      true,
    );
  },

  getUsers() {
    return withBackendOrFallback<{ users: UserProfile[] }>(
      '/api/users',
      {},
      (token) => clientFallbackApi.getUsers(token),
      true,
    );
  },

  createUser(payload: {
    email: string;
    fullName: string;
    nip: string;
    positionTitle: string;
    role: UserRole;
    password: string;
  }) {
    return withBackendOrFallback<{ user: UserProfile }>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      (token) => clientFallbackApi.createUser(token, payload),
    );
  },

  updateUser(
    id: string,
    payload: {
      email: string;
      fullName: string;
      nip: string;
      positionTitle: string;
      role: UserRole;
      password?: string;
    },
  ) {
    return withBackendOrFallback<{ user: UserProfile }>(
      `/api/users/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      (token) => clientFallbackApi.updateUser(token, id, payload),
    );
  },

  deleteUser(id: string) {
    return withBackendOrFallback<{ deleted: boolean; id: string }>(
      `/api/users/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
      (token) => clientFallbackApi.deleteUser(token, id),
    );
  },

  getStudents(params?: { className?: string; search?: string }) {
    const sp = new URLSearchParams();
    if (params?.className) sp.set('className', params.className);
    if (params?.search) sp.set('search', params.search);
    const qs = sp.toString();
    return withBackendOrFallback<{ students: Student[] }>(
      `/api/students${qs ? `?${qs}` : ''}`,
      {},
      (token) => clientFallbackApi.getStudents(token, params),
      true,
    );
  },

  createStudent(payload: { nis: string; name: string; className: string }) {
    return withBackendOrFallback<{ student: Student }>(
      '/api/students',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      (token) => clientFallbackApi.createStudent(token, payload),
      true,
    );
  },

  updateStudent(id: string, payload: { nis: string; name: string; className: string }) {
    return withBackendOrFallback<{ student: Student }>(
      `/api/students/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      (token) => clientFallbackApi.updateStudent(token, id, payload),
      true,
    );
  },

  deleteStudent(id: string) {
    return withBackendOrFallback<{ deleted: boolean; id: string }>(
      `/api/students/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
      (token) => clientFallbackApi.deleteStudent(token, id),
      true,
    );
  },

  getEmployeeAttendance(params?: {
    scope?: 'me' | 'all';
    startDate?: string;
    endDate?: string;
    role?: string;
  }) {
    const sp = new URLSearchParams();
    if (params?.scope) sp.set('scope', params.scope);
    if (params?.startDate) sp.set('startDate', params.startDate);
    if (params?.endDate) sp.set('endDate', params.endDate);
    if (params?.role) sp.set('role', params.role);
    const qs = sp.toString();
    return withBackendOrFallback<{ records: EmployeeAttendanceRecord[] }>(
      `/api/attendance/employees${qs ? `?${qs}` : ''}`,
      {},
      (token) => clientFallbackApi.getEmployeeAttendance(token, params),
      true,
    );
  },

  employeeCheckIn(status: EmployeeAttendanceStatus, notes: string) {
    return withBackendOrFallback<{ record: EmployeeAttendanceRecord }>(
      '/api/attendance/employees/check-in',
      {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      },
      (token) => clientFallbackApi.employeeCheckIn(token, status, notes),
      true,
    );
  },

  employeeCheckOut() {
    return withBackendOrFallback<{ record: EmployeeAttendanceRecord }>(
      '/api/attendance/employees/check-out',
      {
        method: 'POST',
      },
      (token) => clientFallbackApi.employeeCheckOut(token),
      true,
    );
  },

  getStudentAttendance(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    className?: string;
    search?: string;
  }) {
    const sp = new URLSearchParams();
    if (params?.date) sp.set('date', params.date);
    if (params?.startDate) sp.set('startDate', params.startDate);
    if (params?.endDate) sp.set('endDate', params.endDate);
    if (params?.className) sp.set('className', params.className);
    if (params?.search) sp.set('search', params.search);
    const qs = sp.toString();
    return withBackendOrFallback<{ records: StudentAttendanceRecord[] }>(
      `/api/attendance/students${qs ? `?${qs}` : ''}`,
      {},
      (token) => clientFallbackApi.getStudentAttendance(token, params),
      true,
    );
  },

  saveStudentAttendanceBatch(
    date: string,
    entries: { studentId: string; status: StudentAttendanceStatus; notes: string }[],
  ) {
    return withBackendOrFallback<{ savedCount: number }>(
      '/api/attendance/students/batch',
      {
        method: 'POST',
        body: JSON.stringify({ date, entries }),
      },
      (token) => clientFallbackApi.saveStudentAttendanceBatch(token, date, entries),
      true,
    );
  },
};
