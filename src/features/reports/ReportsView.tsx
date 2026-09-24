import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Users, UserCheck } from 'lucide-react';
import { StatusBadge, TypeBadge } from '../../components/ui/Badge.js';
import type { ClassItem, TeacherItem, UserSession } from '../../types/index.js';

interface ReportsViewProps {
  currentSession: UserSession | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentSession }) => {
  const [reportType, setReportType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  // Filter params
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [status, setStatus] = useState('');
  const [picketType, setPicketType] = useState('');

  const [studentData, setStudentData] = useState<any[]>([]);
  const [teacherData, setTeacherData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/classes').then((res) => res.json()).then(setClasses).catch(console.error);
    fetch('/api/teachers').then((res) => res.json()).then((d) => setTeachers(d.items || [])).catch(console.error);
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'STUDENT') {
        let url = `/api/reports/students?startDate=${startDate}&endDate=${endDate}`;
        if (classId) url += `&classId=${classId}`;
        if (status) url += `&status=${status}`;
        const res = await fetch(url);
        if (res.ok) setStudentData(await res.json());
      } else {
        let url = `/api/reports/teachers?startDate=${startDate}&endDate=${endDate}`;
        if (teacherId) url += `&teacherId=${teacherId}`;
        if (picketType) url += `&type=${picketType}`;
        if (status) url += `&status=${status}`;
        const res = await fetch(url);
        if (res.ok) setTeacherData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, startDate, endDate, classId, teacherId, status, picketType]);

  const handleExportCsv = () => {
    let url = '';
    if (reportType === 'STUDENT') {
      url = `/api/reports/export/students?startDate=${startDate}&endDate=${endDate}`;
      if (classId) url += `&classId=${classId}`;
      if (status) url += `&status=${status}`;
    } else {
      url = `/api/reports/export/teachers?startDate=${startDate}&endDate=${endDate}`;
      if (teacherId) url += `&teacherId=${teacherId}`;
      if (picketType) url += `&type=${picketType}`;
      if (status) url += `&status=${status}`;
    }
    window.location.href = url;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Laporan & Rekapitulasi Presensi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter data kehadiran berdasarkan rentang tanggal, kelas, guru, dan unduh format CSV / Cetak PDF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setReportType('STUDENT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              reportType === 'STUDENT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Laporan Absensi Siswa</span>
          </button>
          <button
            onClick={() => setReportType('TEACHER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              reportType === 'TEACHER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Laporan Absensi Guru</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          {reportType === 'STUDENT' ? (
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                Filter Kelas
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                Filter Guru
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="">Semua Guru</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              Filter Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            >
              <option value="">Semua Status</option>
              <option value="HADIR">HADIR</option>
              <option value="TERLAMBAT">TERLAMBAT</option>
              <option value="IZIN">IZIN</option>
              <option value="SAKIT">SAKIT</option>
              <option value="ALPHA">ALPHA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-black">SMP NEGERI 1 INDONESIA TERPADU</h1>
        <h2 className="text-sm font-bold">
          {reportType === 'STUDENT' ? 'LAPORAN PRESENSI SISWA' : 'LAPORAN PRESENSI GURU'}
        </h2>
        <p className="text-xs text-slate-500">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat laporan...</div>
        ) : reportType === 'STUDENT' ? (
          studentData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Tidak ada data absensi siswa pada kriteria filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">NIS</th>
                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                    <th className="px-4 py-3 font-semibold">Kelas</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-medium">{row.date}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{row.studentNis}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {row.studentName}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">{row.className}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : teacherData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada data absensi guru pada kriteria filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Nama Guru</th>
                  <th className="px-4 py-3 font-semibold">Jenis Tugas</th>
                  <th className="px-4 py-3 font-semibold">Jadwal</th>
                  <th className="px-4 py-3 font-semibold">Waktu Hadir</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teacherData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-medium">{row.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {row.teacherName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{row.scheduled}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-600">
                      {row.actualTime}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
