export type UserRole = 'admin' | 'guru' | 'tenaga_kependidikan';

export type EmployeeAttendanceStatus = 'Hadir' | 'Izin' | 'Sakit';
export type StudentAttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  nip: string;
  positionTitle: string;
  role: UserRole;
  authProvider: 'supabase' | 'local';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  className: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  nip: string;
  date: string; // YYYY-MM-DD
  status: EmployeeAttendanceStatus;
  checkInTime: string; // ISO string
  checkOutTime: string | null;
  notes: string;
}

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: StudentAttendanceStatus;
  notes: string;
  recordedById: string;
  recordedByName: string;
  updatedAt: string;
}

export interface DashboardSummary {
  todayDate: string;
  totalEmployees: number;
  employeesPresentToday: number;
  employeesLeaveToday: number;
  totalStudents: number;
  studentsPresentToday: number;
  studentsAbsentToday: number;
  myTodayAttendance: EmployeeAttendanceRecord | null;
  recentEmployeeLogs: EmployeeAttendanceRecord[];
  recentStudentLogs: StudentAttendanceRecord[];
}
