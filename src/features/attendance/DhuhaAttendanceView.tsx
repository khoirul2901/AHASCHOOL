import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  Users,
  GraduationCap,
  Briefcase,
  Moon,
  Sun,
  ShieldCheck,
  RefreshCw,
  Heart,
  Volume2,
  VolumeX,
  Radio,
  Smartphone,
  Cpu,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { isWebNfcSupported, nfcManager } from '../../utils/nfcHelper.js';
import { playSuccessBeep, playDuplicateBeep, playErrorBeep } from '../../utils/audioFeedback.js';
import type { DhuhaStatus, ClassItem, UserSession } from '../../types/index.js';

interface DhuhaItem {
  personId: string;
  targetType: 'STUDENT' | 'TEACHER';
  name: string;
  identifier: string;
  nisn?: string;
  classOrSubject: string;
  classId?: string;
  gender: 'L' | 'P';
  date: string;
  status: DhuhaStatus;
  time: string;
  note: string;
}

interface DhuhaAttendanceViewProps {
  currentSession: UserSession | null;
}

export const DhuhaAttendanceView: React.FC<DhuhaAttendanceViewProps> = ({ currentSession }) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'rekap'>('scanner');
  const [targetType, setTargetType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<DhuhaItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    hadir: 0,
    berhalangan: 0,
    belum: 0,
    rate: 0,
  });

  // Scanner State
  const [scannerMode, setScannerMode] = useState<'ALL' | 'NFC' | 'HARDWARE' | 'CAMERA' | 'MANUAL'>('ALL');
  const [manualCode, setManualCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<{
    person: { name: string; classOrSubject: string; identifier: string };
    time: string;
    isAlreadyRecorded: boolean;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<
    { name: string; classOrSubject: string; time: string; identifier: string }[]
  >([]);

  // Camera State
  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const keyBufferRef = useRef<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Load Classes
  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((data) => setClasses(data || []))
      .catch(console.error);
  }, []);

  // Web NFC Scanner Initializer
  useEffect(() => {
    if (activeTab !== 'scanner' || (scannerMode !== 'ALL' && scannerMode !== 'NFC')) {
      nfcManager.stopScan();
      return;
    }

    if (isWebNfcSupported()) {
      nfcManager.startScan(
        (res) => {
          const uid = res.serialNumber || res.records?.[0]?.data;
          if (uid) {
            handleProcessScan(uid, 'NFC');
          }
        },
        (err) => console.warn('Dhuha NFC warn:', err)
      );
    }

    return () => {
      nfcManager.stopScan();
    };
  }, [activeTab, scannerMode, selectedDate]);

  // Load Dhuha Data
  const loadData = async () => {
    try {
      setLoading(true);
      let url = `/api/attendance/dhuha?date=${selectedDate}&targetType=${targetType}`;
      if (selectedClassId && targetType === 'STUDENT') {
        url += `&classId=${selectedClassId}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error loading dhuha data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, targetType, selectedClassId, search]);

  // Process Scan Code
  const handleProcessScan = async (
    code: string,
    method: 'CAMERA' | 'HARDWARE_SCANNER' | 'NFC' | 'MANUAL'
  ) => {
    const cleanCode = code.trim();
    if (!cleanCode || isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const userId = currentSession?.id || currentSession?.user?.id || 'dhuha-scanner';
      const res = await fetch('/api/attendance/dhuha/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          code: cleanCode,
          method,
          date: selectedDate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (soundEnabled) playErrorBeep();
        setErrorMessage(data.error || 'Barcode / QR kartu tidak terdaftar.');
        setLastScanResult(null);
      } else {
        if (soundEnabled) {
          if (data.isAlreadyRecorded) {
            playDuplicateBeep();
          } else {
            playSuccessBeep();
          }
        }

        const scanData = {
          person: data.person,
          time: data.record.time,
          isAlreadyRecorded: data.isAlreadyRecorded,
          message: data.message,
        };

        setLastScanResult(scanData);
        setRecentScans((prev) => [
          {
            name: data.person.name,
            classOrSubject: data.person.classOrSubject,
            time: data.record.time,
            identifier: data.person.identifier,
          },
          ...prev.slice(0, 9),
        ]);

        // Reload data to keep table updated
        loadData();
      }
    } catch (err: any) {
      if (soundEnabled) playErrorBeep();
      setErrorMessage('Terjadi kendala scanner: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Hard Scanner Keyboard Wedge Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input/textarea, let it be
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'Enter') {
        if (keyBufferRef.current.length >= 3) {
          const buffer = keyBufferRef.current;
          keyBufferRef.current = '';
          handleProcessScan(buffer, 'HARDWARE_SCANNER');
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
        setTimeout(() => {
          keyBufferRef.current = '';
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, isProcessing, soundEnabled]);

  // Start Camera
  const startCamera = async () => {
    try {
      const html5QrCode = new Html5Qrcode('dhuha-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleProcessScan(decodedText, 'CAMERA');
        },
        () => {}
      );
      setIsCameraRunning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      alert('Gagal mengakses kamera: ' + (err.message || 'Periksa izin kamera'));
      setIsCameraRunning(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null;
      setIsCameraRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Update Status Manually
  const handleUpdateStatus = async (
    personId: string,
    newStatus: DhuhaStatus,
    note?: string
  ) => {
    try {
      const res = await fetch('/api/attendance/dhuha/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || 'admin',
        },
        body: JSON.stringify({
          personId,
          targetType,
          date: selectedDate,
          status: newStatus,
          note,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update dhuha status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Presensi Sholat Dhuha Berjamaah
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Ibadah Harian
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan presensi ibadah Sholat Dhuha siswa & dewan guru terpadu dengan scanner barcode/QR otomatis.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden"
              />
            </div>

            {/* Print Report */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Tab & Sub-navigation */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Main Mode Tabs: Scanner vs Rekap */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 max-w-md">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${
                activeTab === 'scanner'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Barcode className="w-4 h-4 text-emerald-600" />
              <span>Mode Scanner Dhuha (Live)</span>
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${
                activeTab === 'rekap'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Rekap & Checklist Jamaah</span>
            </button>
          </div>

          {/* Target: Siswa vs Guru */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Target:</span>
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setTargetType('STUDENT')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                  targetType === 'STUDENT'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Siswa</span>
              </button>
              <button
                onClick={() => setTargetType('TEACHER')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                  targetType === 'TEACHER'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Guru & Pegawai</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Jamaah Hadir
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.hadir}
            </span>
            <span className="text-xs text-slate-500">/ {stats.total} orang</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Tercatat Sholat</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tingkat Partisipasi
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {stats.rate}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Persentase Jamaah</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Berhalangan (Haid)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500">
              {stats.berhalangan}
            </span>
            <span className="text-xs text-slate-500">orang</span>
          </div>
          <span className="text-[10px] text-rose-500 font-semibold">Halangan Syar'i</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Belum Tercatat
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-600 dark:text-slate-300">
              {stats.belum}
            </span>
            <span className="text-xs text-slate-500">orang</span>
          </div>
          <span className="text-[10px] text-slate-400">Belum Melakukan Scan</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MODE SCANNER DHUHA (KAMERA & HARD SCANNER LIVE)                     */}
      {/* ========================================================================= */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Stage Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Feedback Card */}
            {lastScanResult && (
              <div
                className={`rounded-2xl border-2 p-5 shadow-sm animate-in slide-in-from-top-4 ${
                  lastScanResult.isAlreadyRecorded
                    ? 'border-amber-400 bg-amber-50/90 dark:border-amber-500/80 dark:bg-amber-950/40'
                    : 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                      lastScanResult.isAlreadyRecorded ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  >
                    {lastScanResult.isAlreadyRecorded ? (
                      <AlertCircle className="h-8 w-8 animate-bounce" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                          lastScanResult.isAlreadyRecorded
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                        }`}
                      >
                        {lastScanResult.isAlreadyRecorded
                          ? 'SUDAH TERCATAT (HANYA 1X / HARI)'
                          : 'SHOLAT DHUHA BERHASIL'}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                        {lastScanResult.time} WIB
                      </span>
                    </div>
                    <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      {lastScanResult.person.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {lastScanResult.person.classOrSubject} &bull; ID/NIS: {lastScanResult.person.identifier}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        lastScanResult.isAlreadyRecorded
                          ? 'text-amber-800 dark:text-amber-200 font-bold'
                          : 'text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      {lastScanResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Scanner Controls Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Scanner Absensi Sholat Dhuha
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Scanner Aktif
                  </span>
                </div>
              </div>

              {/* 5-Mode Tabs Selector */}
              <div className="mb-5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Pilih Mode Scanner Dhuha:
                </span>
                <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setScannerMode('ALL')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      scannerMode === 'ALL'
                        ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Semua Sensor Aktif (NFC, Laser, Kamera, Manual)"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerMode('NFC')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      scannerMode === 'NFC'
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400'
                    }`}
                    title="Sensor Tap Kartu NFC / Smartphone"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>NFC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerMode('HARDWARE')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      scannerMode === 'HARDWARE'
                        ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Hard Scanner Laser Barcode / RFID"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Laser</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerMode('CAMERA')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      scannerMode === 'CAMERA'
                        ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Kamera Webcam / HP"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerMode('MANUAL')}
                    className={`py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      scannerMode === 'MANUAL'
                        ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Input Manual NIS / NIP / ID"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Manual</span>
                  </button>
                </div>
              </div>

              {/* 1. NFC Sensor Area */}
              {(scannerMode === 'ALL' || scannerMode === 'NFC') && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 text-center">
                  <div className="relative inline-flex items-center justify-center mb-2">
                    <span className="absolute h-16 w-16 rounded-full bg-indigo-400/20 animate-ping" />
                    <div className="relative p-2.5 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
                    Area Tap Sensor NFC Dhuha Aktif
                    {isWebNfcSupported() ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        WEB NFC OK
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        USB NFC OK
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                    Tempelkan kartu pelajar pintar ber-NFC, e-KTP, atau smartphone di area sensor NFC masjid/sekolah untuk mencatat sholat dhuha otomatis.
                  </p>
                </div>
              )}

              {/* 2. Hard Scanner Radar Info */}
              {(scannerMode === 'ALL' || scannerMode === 'HARDWARE') && (
                <div className="mb-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20 text-center">
                  <div className="inline-flex p-2.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 mb-2">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Hard Scanner Laser Barcode Aktif
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                    Tembak barcode / QR pada kartu siswa atau guru dengan mesin barcode gun otomatis.
                  </p>
                </div>
              )}

              {/* 3. Camera Scanner Viewfinder */}
              {(scannerMode === 'ALL' || scannerMode === 'CAMERA') && (
                <div className="mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Scan via Kamera HP / Webcam</span>
                    </div>

                    {!isCameraRunning ? (
                      <button
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Buka Kamera</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                      >
                        <span>Tutup Kamera</span>
                      </button>
                    )}
                  </div>

                  <div
                    id="dhuha-reader"
                    className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 ${
                      isCameraRunning ? 'block min-h-[250px]' : 'hidden'
                    }`}
                  />
                </div>
              )}

              {/* 4. Manual Input Form */}
              {(scannerMode === 'ALL' || scannerMode === 'MANUAL') && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Input Manual NIS / NIP / UID Kartu:
                  </label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (manualCode.trim()) {
                        handleProcessScan(manualCode.trim(), 'MANUAL');
                        setManualCode('');
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Input manual NIS / NIP / UID kartu lalu Enter..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || isProcessing}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Proses
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Feed of Recent Scans */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Aktivitas Scan Dhuha Hari Ini
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  {recentScans.length} Baru
                </span>
              </div>

              {recentScans.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada aktivitas scan dhuha. Silakan scan kartu di sensor.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {recentScans.map((scan, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {scan.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {scan.classOrSubject} &bull; NIS: {scan.identifier}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        {scan.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REKAP & CHECKLIST JAMAAH DHUHA                                      */}
      {/* ========================================================================= */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3">
              {targetType === 'STUDENT' && (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">Semua Rombel (Kelas)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, NIS, NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Total Data: <strong>{items.length}</strong> peserta
            </div>
          </div>

          {/* Table List */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Memuat data presensi sholat dhuha...
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Tidak ada data jamaah yang ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                      <th className="px-4 py-3 font-semibold">NIS / NIP</th>
                      <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                      <th className="px-4 py-3 font-semibold">
                        {targetType === 'STUDENT' ? 'Kelas' : 'Jabatan / Mapel'}
                      </th>
                      <th className="px-4 py-3 font-semibold">L/P</th>
                      <th className="px-4 py-3 font-semibold text-center">Status Sholat Dhuha</th>
                      <th className="px-4 py-3 font-semibold text-center">Waktu Scan</th>
                      <th className="px-4 py-3 font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <tr
                        key={item.personId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                          {item.identifier}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                          {item.classOrSubject}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              item.gender === 'P' ? 'text-pink-600' : 'text-blue-600'
                            }`}
                          >
                            {item.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Sudah Sholat */}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.personId, 'HADIR')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                item.status === 'HADIR'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              Sudah Sholat
                            </button>

                            {/* Tombol Berhalangan (Haid / Syar'i) */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(
                                  item.personId,
                                  'BERHALANGAN',
                                  "Halangan Syar'i (Haid)"
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                item.status === 'BERHALANGAN'
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                              title="Tandai siswi/guru yang berhalangan haid"
                            >
                              Halangan (Haid)
                            </button>

                            {/* Tombol Belum Sholat */}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.personId, 'TIDAK_HADIR', '-')}
                              className={`px-2 py-1 rounded-lg text-[11px] transition ${
                                item.status === 'TIDAK_HADIR'
                                  ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-bold'
                                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Belum
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.time || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {item.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
