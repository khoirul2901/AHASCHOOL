import React from 'react';
import type { AttendanceStatus, AttendanceType } from '../../types/index.js';

export const StatusBadge: React.FC<{ status: AttendanceStatus | string }> = ({ status }) => {
  switch (status) {
    case 'HADIR':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          HADIR
        </span>
      );
    case 'TERLAMBAT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          TERLAMBAT
        </span>
      );
    case 'IZIN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
          IZIN
        </span>
      );
    case 'SAKIT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
          SAKIT
        </span>
      );
    case 'ALPHA':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
          ALPHA
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          {status}
        </span>
      );
  }
};

export const TypeBadge: React.FC<{ type: AttendanceType | string }> = ({ type }) => {
  if (type === 'PICKET') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
        PIKET
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
      MENGAJAR
    </span>
  );
};
