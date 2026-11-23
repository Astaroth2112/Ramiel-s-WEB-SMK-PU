import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';
import type { EmployeeAttendanceStatus, StudentAttendanceStatus } from '../types';

export function AttendanceStatusText({
  status,
}: {
  status: EmployeeAttendanceStatus | StudentAttendanceStatus;
}) {
  if (status === 'Hadir') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Hadir</span>
      </span>
    );
  }
  if (status === 'Izin') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Izin</span>
      </span>
    );
  }
  if (status === 'Sakit') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Sakit</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-700">
      <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Alpha</span>
    </span>
  );
}
