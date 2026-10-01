import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  Printer,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Edit3,
  QrCode,
  GraduationCap,
  Briefcase,
  Layers,
  Filter,
  RefreshCw,
  Info,
  Download,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { StudentItem, TeacherItem, ClassItem, UserSession } from '../../types/index.js';

interface IdCardGeneratorViewProps {
  currentSession: UserSession | null;
}

export const IdCardGeneratorView: React.FC<IdCardGeneratorViewProps> = ({ currentSession }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Selection for printing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cardSide, setCardSide] = useState<'front' | 'both'>('front');
  const [colorTheme, setColorTheme] = useState<'blue' | 'emerald' | 'indigo'>('blue');

  // QR Code data URL cache: id -> base64 png
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  // Custom QR ID Edit Modal
  const [editingTarget, setEditingTarget] = useState<{
    id: string;
    name: string;
    type: 'student' | 'teacher';
    currentCardId: string;
  } | null>(null);
  const [customCardInput, setCustomCardInput] = useState<string>('');
  const [savingCustomId, setSavingCustomId] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load classes
  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((data) => {
        setClasses(data || []);
      })
      .catch(console.error);
  }, []);

  // Load students or teachers
  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'students') {
        let url = `/api/students?limit=200&search=${encodeURIComponent(search)}`;
        if (selectedClass) url += `&classId=${selectedClass}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.items || []);
          // Auto-select all by default if less than 50
          const items: StudentItem[] = data.items || [];
          setSelectedIds(items.slice(0, 20).map((s) => s.id));
        }
      } else {
        const url = `/api/teachers?limit=200&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setTeachers(data.items || []);
          const items: TeacherItem[] = data.items || [];
          setSelectedIds(items.slice(0, 20).map((t) => t.id));
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedClass, search]);

  // Generate QR Codes whenever items change
  useEffect(() => {
    const generateAllQrs = async () => {
      const items = activeTab === 'students' ? students : teachers;
      const newMap: Record<string, string> = {};

      for (const item of items) {
        // The QR string to encode: custom cardId if available, else NIS/NIP or ID
        const codeValue =
          (item as any).cardId ||
          (item as any).rfidTag ||
          (item as any).nis ||
          (item as any).nip ||
          item.id;

        try {
          const url = await QRCode.toDataURL(codeValue, {
            width: 256,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          newMap[item.id] = url;
        } catch (e) {
          console.error('Error generating QR for', item.id, e);
        }
      }

      setQrCodeUrls(newMap);
    };

    if ((activeTab === 'students' && students.length > 0) || (activeTab === 'teachers' && teachers.length > 0)) {
      generateAllQrs();
    }
  }, [students, teachers, activeTab]);

  // Handle select / deselect
  const currentItems = activeTab === 'students' ? students : teachers;
  const isAllSelected = currentItems.length > 0 && selectedIds.length === currentItems.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((item) => item.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open custom QR ID modal
  const handleOpenEditCustomId = (item: StudentItem | TeacherItem) => {
    const currentId =
      (item as any).cardId ||
      (item as any).rfidTag ||
      (item as any).nis ||
      (item as any).nip ||
      item.id;

    setEditingTarget({
      id: item.id,
      name: item.name,
      type: activeTab === 'students' ? 'student' : 'teacher',
      currentCardId: currentId,
    });
    setCustomCardInput(currentId);
    setSaveSuccessMsg(null);
  };

  // Save custom card ID
  const handleSaveCustomId = async () => {
    if (!editingTarget) return;
    const cleanId = customCardInput.trim();
    if (!cleanId) {
      alert('ID Kartu / QR Code tidak boleh kosong.');
      return;
    }

    try {
      setSavingCustomId(true);
      const url =
        editingTarget.type === 'student'
          ? `/api/students/${editingTarget.id}`
          : `/api/teachers/${editingTarget.id}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || 'admin',
        },
        body: JSON.stringify({
          cardId: cleanId,
          rfidTag: cleanId,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menyimpan ID kustom');
      }

      // Re-generate QR for this item immediately
      const newQrUrl = await QRCode.toDataURL(cleanId, {
        width: 256,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });

      setQrCodeUrls((prev) => ({
        ...prev,
        [editingTarget.id]: newQrUrl,
      }));

      // Update state locally
      if (editingTarget.type === 'student') {
        setStudents((prev) =>
          prev.map((s) => (s.id === editingTarget.id ? { ...s, cardId: cleanId } : s))
        );
      } else {
        setTeachers((prev) =>
          prev.map((t) => (t.id === editingTarget.id ? { ...t, cardId: cleanId } : t))
        );
      }

      setSaveSuccessMsg(`Berhasil menghubungkan kartu fisik dengan kode: ${cleanId}`);
      setTimeout(() => {
        setEditingTarget(null);
        setSaveSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingCustomId(false);
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert('Pilih minimal satu kartu untuk dicetak.');
      return;
    }
    window.print();
  };

  const printableItems = currentItems.filter((i) => selectedIds.includes(i.id));

  return (
    <div className="space-y-6">
      {/* Print CSS styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      {/* Screen Header Controls (Hidden in Print) */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Generator & Cetak ID Card (QR Fisik)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Desain kartu pelajar & pendidik resmi. Anda bisa <strong>memasukkan kode QR kartu fisik</strong> yang sudah ada agar absensi langsung sinkron.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Tab & Filter Selection */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          {/* Target: Siswa vs Guru */}
          <div className="md:col-span-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => {
                setActiveTab('students');
                setSelectedIds([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'students'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Kartu Siswa ({students.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('teachers');
                setSelectedIds([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'teachers'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Kartu Guru ({teachers.length})</span>
            </button>
          </div>

          {/* Filter Kelas jika Siswa */}
          {activeTab === 'students' && (
            <div className="md:col-span-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Rombel (Kelas)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search bar */}
          <div className={activeTab === 'students' ? 'md:col-span-3' : 'md:col-span-6'}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIS, NIP, atau ID Kartu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options: Front only or Both sides */}
          <div className="md:col-span-2">
            <select
              value={cardSide}
              onChange={(e) => setCardSide(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="front">Sisi Depan Saja</option>
              <option value="both">Bolak-Balik (Depan & Belakang)</option>
            </select>
          </div>
        </div>

        {/* Action bar: Select all & Info */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Batalkan Semua Pilihan</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>Pilih Semua ({currentItems.length})</span>
                </>
              )}
            </button>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500">
              Terpilih: <strong>{selectedIds.length}</strong> kartu
            </span>
          </div>

          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Klik tombol <strong>"Hubungkan QR Fisik"</strong> pada tiap kartu untuk menyamakan ID dengan kartu fisik Anda.
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Cards on Screen */}
      <div className="no-print">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Memuat daftar kartu identitas...
          </div>
        ) : currentItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
            Tidak ada data {activeTab === 'students' ? 'siswa' : 'guru'} yang sesuai pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const customId =
                (item as any).cardId ||
                (item as any).rfidTag ||
                (item as any).nis ||
                (item as any).nip ||
                item.id;
              const qrUrl = qrCodeUrls[item.id];
              const isTeacher = activeTab === 'teachers';

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500 dark:border-blue-600 dark:bg-blue-950/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {/* Select Checkbox & Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>Cetak Kartu Ini</span>
                    </label>

                    <button
                      onClick={() => handleOpenEditCustomId(item)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
                      title="Ubah nilai QR Code agar sama dengan kartu fisik Anda"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Hubungkan QR Fisik</span>
                    </button>
                  </div>

                  {/* ID CARD PREVIEW (CR80 RATIO: 85.6mm x 54mm) */}
                  <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-4 text-white shadow-lg">
                    {/* Background Pattern Watermark */}
                    <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                      <QrCode className="w-36 h-36" />
                    </div>

                    {/* Card Header Kop */}
                    <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs shadow-inner">
                          AH
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-blue-300 leading-tight">
                            SMP AL-HIKAM
                          </div>
                          <div className="text-[8px] text-white/70">
                            {isTeacher ? 'KARTU IDENTITAS PENDIDIK' : 'KARTU TANDA PELAJAR'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded bg-blue-500/30 px-1.5 py-0.5 text-[8px] font-bold text-blue-200 border border-blue-400/30">
                          {isTeacher ? 'STAFF / GURU' : (item as StudentItem).className || 'SISWA'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex items-center gap-3">
                      {/* Photo / Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-20 rounded-lg bg-white/10 border-2 border-white/30 flex flex-col items-center justify-center text-white/50 overflow-hidden shadow-inner">
                          {item.gender === 'P' ? (
                            <span className="text-2xl">🧕</span>
                          ) : (
                            <span className="text-2xl">👨‍🎓</span>
                          )}
                          <span className="text-[7px] text-white/70 font-semibold mt-1">PAS FOTO</span>
                        </div>
                      </div>

                      {/* Biodata */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-black truncate text-white leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-blue-200/90 font-mono">
                          {isTeacher
                            ? `NIP: ${(item as TeacherItem).nip || '-'}`
                            : `NIS: ${(item as StudentItem).nis}`}
                        </div>
                        <div className="text-[9px] text-white/80">
                          {isTeacher
                            ? `Jabatan: ${(item as any).subject || 'Tenaga Pendidik'}`
                            : `Kelas: ${(item as StudentItem).className || '-'}`}
                        </div>

                        {/* Custom QR Code badge & NFC Chip indicator */}
                        <div className="pt-1 flex items-center gap-1 flex-wrap">
                          <div className="inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[8.5px] font-mono text-emerald-300 border border-emerald-500/30">
                            <QrCode className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[100px]">{customId}</span>
                          </div>
                          {(item as any).nfcUid && (
                            <div className="inline-flex items-center gap-1 rounded bg-indigo-950/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-indigo-300 border border-indigo-500/40" title={`Chip NFC: ${(item as any).nfcUid}`}>
                              <Radio className="w-2.5 h-2.5 text-indigo-400" />
                              <span>NFC</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* QR Code Graphic */}
                      <div className="shrink-0 flex flex-col items-center justify-center bg-white p-1 rounded-lg shadow-md">
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                        ) : (
                          <div className="w-14 h-14 flex items-center justify-center text-[8px] text-slate-400">
                            Loading...
                          </div>
                        )}
                        <span className="text-[6.5px] font-mono font-bold text-slate-700 mt-0.5">
                          SCAN ME
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-3 pt-1.5 border-t border-white/10 flex items-center justify-between text-[7.5px] text-white/60">
                      <span>Berlaku s/d: Th. Ajaran 2026/2027</span>
                      <span>SIAKAD TERPADU</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRINT-ONLY AREA: RENDERED IN CLEAN A4 GRID FOR DIRECT PRINTING / PDF     */}
      {/* ========================================================================= */}
      <div id="print-area" className="hidden print:block">
        <div className="mb-4 text-center border-b border-slate-300 pb-2">
          <h1 className="text-base font-bold uppercase tracking-wider text-slate-900">
            SMP AL-HIKAM &bull; LEMBAR CETAK ID CARD TERPADU
          </h1>
          <p className="text-[10px] text-slate-600">
            Ukuran Standar ID Card (85.6mm x 54mm) &bull; Total Kartu: {printableItems.length}
          </p>
        </div>

        {/* 2 Columns Grid for Standard Card Cutting */}
        <div className="grid grid-cols-2 gap-4">
          {printableItems.map((item) => {
            const customId =
              (item as any).cardId ||
              (item as any).rfidTag ||
              (item as any).nis ||
              (item as any).nip ||
              item.id;
            const qrUrl = qrCodeUrls[item.id];
            const isTeacher = activeTab === 'teachers';

            return (
              <React.Fragment key={item.id}>
                {/* SISI DEPAN (FRONT) */}
                <div
                  style={{
                    width: '85.6mm',
                    height: '54mm',
                    boxSizing: 'border-box',
                  }}
                  className="rounded-xl border border-slate-400 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-3 text-white flex flex-col justify-between shadow-sm relative overflow-hidden"
                >
                  {/* Watermark */}
                  <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                    <QrCode className="w-24 h-24" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-black text-[10px] text-white">
                        AH
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider text-blue-300 leading-tight">
                          SMP AL-HIKAM
                        </div>
                        <div className="text-[7px] text-white/70">
                          {isTeacher ? 'KARTU IDENTITAS GURU & PEGAWAI' : 'KARTU TANDA PELAJAR'}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-blue-500/40 px-1 py-0.5 text-[7px] font-bold text-white border border-blue-400/40">
                      {isTeacher ? 'STAFF' : (item as StudentItem).className || 'SISWA'}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="flex items-center gap-2.5 my-auto">
                    {/* Photo Box */}
                    <div className="w-12 h-16 rounded bg-white/10 border border-white/40 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl">{item.gender === 'P' ? '🧕' : '👨‍🎓'}</span>
                      <span className="text-[6px] text-white/70 mt-0.5">FOTO</span>
                    </div>

                    {/* Biodata */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="text-[10px] font-black leading-tight truncate text-white">
                        {item.name}
                      </div>
                      <div className="text-[8px] font-mono text-blue-200">
                        {isTeacher ? `NIP: ${(item as TeacherItem).nip || '-'}` : `NIS: ${(item as StudentItem).nis}`}
                      </div>
                      <div className="text-[7.5px] text-white/80">
                        {isTeacher
                          ? `Bidang: ${(item as any).subject || 'Pendidik'}`
                          : `Kelas: ${(item as StudentItem).className || '-'}`}
                      </div>
                      <div className="text-[7px] font-mono text-emerald-300 bg-black/40 px-1 py-0.5 rounded inline-block">
                        ID: {customId}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-1 rounded shrink-0 flex flex-col items-center">
                      {qrUrl && <img src={qrUrl} alt="QR" className="w-12 h-12 object-contain" />}
                      <span className="text-[5.5px] font-bold font-mono text-slate-800">
                        PRESENSI
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/20 pt-1 flex items-center justify-between text-[6.5px] text-white/60">
                    <span>Berlaku s/d: Th. Ajaran 2026/2027</span>
                    <span>SIAKAD SEKOLAH TERPADU</span>
                  </div>
                </div>

                {/* SISI BELAKANG (BACK) jika opsi 'both' dipilih */}
                {cardSide === 'both' && (
                  <div
                    style={{
                      width: '85.6mm',
                      height: '54mm',
                      boxSizing: 'border-box',
                    }}
                    className="rounded-xl border border-slate-300 bg-white p-3 text-slate-800 flex flex-col justify-between shadow-sm relative"
                  >
                    <div>
                      <div className="text-center font-bold text-[8.5px] uppercase tracking-wide border-b pb-1 text-slate-900">
                        Ketentuan & Tata Tertib Pemegang Kartu
                      </div>
                      <ol className="text-[6.5px] text-slate-600 mt-1.5 list-decimal pl-3 space-y-0.5 leading-tight">
                        <li>Kartu ini wajib dibawa setiap hari sekolah sebagai identitas & bukti presensi resmi.</li>
                        <li>Scan QR code pada kartu ini pada mesin kiosk absensi gerbang sekolah.</li>
                        <li>Kartu tidak boleh dipindahtangankan, dipinjamkan, atau dirusak.</li>
                        <li>Apabila menemukan kartu ini, harap dikembalikan ke Bagian Tata Usaha SMP AL-HIKAM.</li>
                      </ol>
                    </div>

                    <div className="flex items-end justify-between pt-1 border-t border-slate-100 text-[6.5px]">
                      <div>
                        <div className="font-semibold text-slate-700">SMP AL-HIKAM</div>
                        <div className="text-slate-500">Jl. Pesantren No. 1, Telp. (0341) 555-SIAKAD</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500">Kepala Sekolah,</div>
                        <div className="h-4"></div>
                        <div className="font-bold underline text-slate-900">Dra. Hj. Siti Rahmawati, M.M.</div>
                        <div className="text-slate-500">NIP. 197003121995012001</div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: HUBUNGKAN QR KARTU FISIK (CUSTOM ID)                              */}
      {/* ========================================================================= */}
      {editingTarget && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTarget(null)}
          title={`Hubungkan Kartu Fisik: ${editingTarget.name}`}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3.5 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
              <QrCode className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Punya Kartu Fisik Berbasis QR Code?</p>
                <p className="mt-0.5 text-blue-700 dark:text-blue-300">
                  Scan atau ketik kode yang tertera di kartu fisik Anda pada kolom di bawah. Saat siswa/guru melakukan scan di gerbang, sistem akan langsung mengenali identitasnya!
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kode Kartu / QR Code Fisik
              </label>
              <input
                type="text"
                value={customCardInput}
                onChange={(e) => setCustomCardInput(e.target.value)}
                placeholder="Contoh: ALHKM-001, 2026001, atau kode unik dari kartu Anda"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Nilai saat ini: <code className="font-mono text-blue-600">{editingTarget.currentCardId}</code>
              </p>
            </div>

            {saveSuccessMsg && (
              <div className="rounded-xl bg-emerald-50 text-emerald-800 p-3 text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCustomId}
                disabled={savingCustomId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition disabled:opacity-50"
              >
                {savingCustomId ? 'Menyimpan...' : 'Simpan & Tautkan Kartu'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
