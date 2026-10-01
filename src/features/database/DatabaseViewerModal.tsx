import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Search,
  FileJson,
  Table as TableIcon,
  RefreshCw,
  HardDrive,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: string;
  separatedFiles?: Array<{ id: string; name: string; file: string; total?: number }>;
  tableStats?: Array<{ name: string; label: string; count: number }>;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
  initialTarget = 'siakad-db',
  separatedFiles = [],
  tableStats = [],
}) => {
  const [target, setTarget] = useState<string>(initialTarget);
  const [dataPayload, setDataPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'json' | 'table'>('json');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    if (isOpen) {
      setTarget(initialTarget);
      fetchTargetData(initialTarget);
    }
  }, [isOpen, initialTarget]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchTargetData = async (targetId: string) => {
    try {
      setLoading(true);
      setDataPayload(null);
      setCurrentPage(1);
      const res = await fetch(`/api/database/view?target=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const json = await res.json();
        setDataPayload(json);
      } else {
        const err = await res.json();
        setDataPayload({ error: err.error || 'Gagal memuat data' });
      }
    } catch (err: any) {
      setDataPayload({ error: err.message || 'Gagal menghubungi server' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTarget = (newTarget: string) => {
    setTarget(newTarget);
    fetchTargetData(newTarget);
  };

  const handleCopy = () => {
    if (!dataPayload?.data) return;
    const text = JSON.stringify(dataPayload.data, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!dataPayload?.data) return;
    const filename = dataPayload.fileName || `${target}.json`;
    const blob = new Blob([JSON.stringify(dataPayload.data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered array items if target is array or contains array
  const rawArray: any[] = useMemo(() => {
    if (!dataPayload?.data) return [];
    if (Array.isArray(dataPayload.data)) return dataPayload.data;
    if (dataPayload.data.data && Array.isArray(dataPayload.data.data)) return dataPayload.data.data;
    return [];
  }, [dataPayload]);

  const filteredArray = useMemo(() => {
    if (!search.trim()) return rawArray;
    const q = search.toLowerCase();
    return rawArray.filter((item) => {
      const str = JSON.stringify(item).toLowerCase();
      return str.includes(q);
    });
  }, [rawArray, search]);

  const totalPages = Math.max(1, Math.ceil(filteredArray.length / pageSize));
  const paginatedArray = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArray.slice(start, start + pageSize);
  }, [filteredArray, currentPage, pageSize]);

  // Formatted JSON string with search filtering support
  const jsonDisplayString = useMemo(() => {
    if (!dataPayload?.data) return '';
    if (rawArray.length > 0 && search.trim()) {
      return JSON.stringify(filteredArray, null, 2);
    }
    // Limit string length for huge siakad-db to prevent browser freezing
    const full = JSON.stringify(dataPayload.data, null, 2);
    return full;
  }, [dataPayload, rawArray, filteredArray, search]);

  // Extract table headers if viewing array
  const tableHeaders = useMemo(() => {
    if (rawArray.length === 0) return [];
    const first = rawArray[0];
    if (typeof first !== 'object' || first === null) return ['Value'];
    return Object.keys(first).filter((k) => k !== 'password' && k !== 'salt');
  }, [rawArray]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Penjelajah Database & Berkas JSON
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {dataPayload?.fileName || `${target}.json`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Buka, telusuri, salin, atau unduh rekaman data secara langsung tanpa perlu aplikasi luar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => fetchTargetData(target)}
              disabled={loading}
              title="Muat Ulang Data"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              disabled={loading || !dataPayload?.data}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin JSON</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !dataPayload?.data}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Target Selector, Search, View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pilih Berkas:
              </span>
              <select
                value={target}
                onChange={(e) => handleSelectTarget(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <optgroup label="Database Utama (Unified)">
                  <option value="siakad-db">siakad-db.json (Seluruh Database SIAKAD)</option>
                </optgroup>
                <optgroup label="Database Terpisah (Modular Files)">
                  <option value="students">students.json (Data Siswa)</option>
                  <option value="teachers">teachers.json (Data Guru & Pegawai)</option>
                  <option value="schedules">teaching_schedules.json (Jadwal Mengajar & Piket)</option>
                  <option value="attendance-students">attendance_students.json (Presensi Siswa)</option>
                  <option value="attendance-teachers">attendance_teachers.json (Presensi Guru)</option>
                  <option value="attendance-dhuha">attendance_dhuha.json (Presensi Dhuha)</option>
                  <option value="master-academic">master_academic.json (Master Akademik & Rombel)</option>
                </optgroup>
                <optgroup label="Tabel Spesifik (Entity)">
                  <option value="classes">store.classes (Daftar Kelas)</option>
                  <option value="subjects">store.subjects (Mata Pelajaran)</option>
                  <option value="picketSchedules">store.picketSchedules (Jadwal Piket)</option>
                  <option value="holidays">store.holidays (Kalender Libur)</option>
                  <option value="users">store.users (Pengguna)</option>
                  <option value="auditLogs">store.auditLogs (Log Audit)</option>
                </optgroup>
              </select>
            </div>

            {/* View Mode Toggle (If Data is an Array) */}
            {rawArray.length > 0 && (
              <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('json')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === 'json'
                      ? 'bg-white shadow-xs text-amber-600 dark:bg-slate-700 dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Format JSON</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === 'table'
                      ? 'bg-white shadow-xs text-amber-600 dark:bg-slate-700 dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel Data</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci, nama, ID, NIP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-emerald-400 min-h-[350px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 gap-3 text-slate-400 font-sans">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">Membuka dan membaca data {target}...</p>
            </div>
          ) : dataPayload?.error ? (
            <div className="p-8 text-center text-rose-400 font-sans">
              <p className="text-sm font-bold">Gagal membuka database</p>
              <p className="text-xs text-rose-400/80 mt-1">{dataPayload.error}</p>
            </div>
          ) : viewMode === 'table' && rawArray.length > 0 ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto text-slate-200 font-sans">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    {tableHeaders.map((h) => (
                      <th key={h} className="px-3 py-2.5 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {paginatedArray.length === 0 ? (
                    <tr>
                      <td colSpan={tableHeaders.length + 1} className="py-8 text-center text-slate-500">
                        Tidak ada catatan yang cocok dengan pencarian "{search}".
                      </td>
                    </tr>
                  ) : (
                    paginatedArray.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 text-center text-slate-500 text-[11px]">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {tableHeaders.map((h) => {
                          const val = row[h];
                          return (
                            <td key={h} className="px-3 py-2 text-[11px] truncate max-w-xs">
                              {typeof val === 'object' && val !== null
                                ? JSON.stringify(val)
                                : String(val !== undefined && val !== null ? val : '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="p-2 overflow-x-auto whitespace-pre leading-relaxed select-text text-[11px]">
              <code>{jsonDisplayString}</code>
            </pre>
          )}
        </div>

        {/* Bottom Status & Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span className="font-semibold">
              Total Rekaman: <strong className="text-slate-800 dark:text-slate-200">{dataPayload?.itemCount ?? rawArray.length}</strong>
            </span>
            {search && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                (Ditemukan: {filteredArray.length} record)
              </span>
            )}
            {dataPayload?.fileSize && (
              <span>
                • Ukuran: {(dataPayload.fileSize / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          {viewMode === 'table' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
