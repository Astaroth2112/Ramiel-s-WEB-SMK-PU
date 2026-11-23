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

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || `Permintaan gagal (${res.status})`);
  }
  return data;
}

export const api = {
  login(email: string, password: string) {
    return apiFetch<{ token: string; user: UserProfile; backend: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(payload: {
    email: string;
    fullName: string;
    nip: string;
    positionTitle: string;
    password: string;
  }) {
    return apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me() {
    return apiFetch<{ user: UserProfile; backend: string }>('/api/auth/me');
  },

  dashboardSummary() {
    return apiFetch<DashboardSummary>('/api/dashboard/summary');
  },

  getUsers() {
    return apiFetch<{ users: UserProfile[] }>('/api/users');
  },

  createUser(payload: {
    email: string;
    fullName: string;
    nip: string;
    positionTitle: string;
    role: UserRole;
    password: string;
  }) {
    return apiFetch<{ user: UserProfile }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    return apiFetch<{ user: UserProfile }>(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteUser(id: string) {
    return apiFetch<{ deleted: boolean; id: string }>(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  getStudents(params?: { className?: string; search?: string }) {
    const sp = new URLSearchParams();
    if (params?.className) sp.set('className', params.className);
    if (params?.search) sp.set('search', params.search);
    const qs = sp.toString();
    return apiFetch<{ students: Student[] }>(`/api/students${qs ? `?${qs}` : ''}`);
  },

  createStudent(payload: { nis: string; name: string; className: string }) {
    return apiFetch<{ student: Student }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStudent(id: string, payload: { nis: string; name: string; className: string }) {
    return apiFetch<{ student: Student }>(`/api/students/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteStudent(id: string) {
    return apiFetch<{ deleted: boolean; id: string }>(`/api/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
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
    return apiFetch<{ records: EmployeeAttendanceRecord[] }>(
      `/api/attendance/employees${qs ? `?${qs}` : ''}`,
    );
  },

  employeeCheckIn(status: EmployeeAttendanceStatus, notes: string) {
    return apiFetch<{ record: EmployeeAttendanceRecord }>('/api/attendance/employees/check-in', {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  },

  employeeCheckOut() {
    return apiFetch<{ record: EmployeeAttendanceRecord }>('/api/attendance/employees/check-out', {
      method: 'POST',
    });
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
    return apiFetch<{ records: StudentAttendanceRecord[] }>(
      `/api/attendance/students${qs ? `?${qs}` : ''}`,
    );
  },

  saveStudentAttendanceBatch(
    date: string,
    entries: { studentId: string; status: StudentAttendanceStatus; notes: string }[],
  ) {
    return apiFetch<{ savedCount: number }>('/api/attendance/students/batch', {
      method: 'POST',
      body: JSON.stringify({ date, entries }),
    });
  },
};
