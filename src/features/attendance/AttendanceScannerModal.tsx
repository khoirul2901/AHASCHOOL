import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Barcode,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  RefreshCw,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  playSuccessBeep,
  playDuplicateBeep,
  playErrorBeep,
  announceAttendanceVoice,
} from '../../utils/audioFeedback.js';
import type { ScanAttendanceResult, UserSession } from '../../types/index.js';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: 'AUTO' | 'STUDENT' | 'TEACHER';
  defaultClassId?: string;
  defaultScheduleId?: string;
  currentSession: UserSession | null;
  onScanSuccess?: (result: ScanAttendanceResult) => void;
}

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  targetType = 'AUTO',
  defaultClassId,
  defaultScheduleId,
  currentSession,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'HARDWARE'>('CAMERA');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Camera State
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Hardware Scanner & Manual Input State
  const [manualCode, setManualCode] = useState('');
  const [recentScans, setRecentScans] = useState<ScanAttendanceResult[]>([]);
  const [lastResult, setLastResult] = useState<ScanAttendanceResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Key buffer for hardware scanner detection
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const isCooldownRef = useRef<boolean>(false);

  // Auto-clear result banner after 4 seconds
  useEffect(() => {
    if (!lastResult) return;
    const timer = setTimeout(() => {
      // Keep in recentScans, just un-highlight active modal result if needed
    }, 4000);
    return () => clearTimeout(timer);
  }, [lastResult]);

  // Process a scanned code
  const handleProcessCode = async (
    scannedCode: string,
    method: 'CAMERA' | 'HARDWARE_SCANNER'
  ) => {
    const code = scannedCode.trim();
    if (!code || isProcessing || isCooldownRef.current) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      isCooldownRef.current = true;

      const userId = currentSession?.id || currentSession?.user?.id || 'scanner';
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          code,
          type: targetType,
          method,
          classId: defaultClassId,
          scheduleId: defaultScheduleId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (soundEnabled) playErrorBeep();
        setErrorMessage(data.error || 'Barcode / QR tidak terdaftar dalam sistem.');
        setLastResult(null);
      } else {
        const scanRes = data as ScanAttendanceResult;
        setLastResult(scanRes);
        setRecentScans((prev) => [scanRes, ...prev.slice(0, 9)]);

        // Sound and Voice feedback
        if (soundEnabled) {
          if (scanRes.isAlreadyRecorded) {
            playDuplicateBeep();
          } else {
            playSuccessBeep();
          }
        }

        if (voiceEnabled) {
          announceAttendanceVoice(scanRes.person.name, scanRes.status, scanRes.person.subtext);
        }

        if (onScanSuccess) {
          onScanSuccess(scanRes);
        }
      }
    } catch (err: any) {
      if (soundEnabled) playErrorBeep();
      setErrorMessage('Terjadi kesalahan koneksi scanner: ' + err.message);
    } finally {
      setIsProcessing(false);
      // Brief cooldown of 1.5 seconds so rapid same-card scan doesn't spam
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 1500);
    }
  };

  // 1. Hardware Scanner Keyboard Wedge Global Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular text area or if target is specific input other than our scanner field
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow Enter to trigger scanner
      if (e.key === 'Enter') {
        if (keyBufferRef.current.length >= 3) {
          const buffer = keyBufferRef.current;
          keyBufferRef.current = '';
          handleProcessCode(buffer, 'HARDWARE_SCANNER');
          e.preventDefault();
          return;
        }
      }

      // Check timing between keystrokes (Hardware scanners type at < 50ms per key)
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Reset buffer if delay was too long (human typing vs hardware scanner)
      if (timeDiff > 200 && keyBufferRef.current.length > 0) {
        keyBufferRef.current = '';
      }

      if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isProcessing, targetType, defaultClassId, defaultScheduleId, soundEnabled, voiceEnabled]);

  // 2. Camera Initializer using Html5Qrcode
  useEffect(() => {
    if (!isOpen || activeTab !== 'CAMERA') {
      stopCamera();
      return;
    }

    let isMounted = true;

    const initCamera = async () => {
      try {
        setCameraError(null);
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam =
            devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('rear')
            ) || devices[0];
          setSelectedCameraId(backCam.id);
          startCamera(backCam.id);
        } else {
          setCameraError('Tidak ditemukan perangkat kamera pada perangkat ini.');
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraError('Gagal mengakses kamera: ' + (err.message || 'Izin kamera ditolak.'));
        }
      }
    };

    const timer = setTimeout(() => {
      initCamera();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async (cameraId: string) => {
    try {
      await stopCamera();
      const readerElement = document.getElementById('camera-reader');
      if (!readerElement) return;

      const html5QrCode = new Html5Qrcode('camera-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleProcessCode(decodedText, 'CAMERA');
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsCameraRunning(true);
      setCameraError(null);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsCameraRunning(false);
      setCameraError('Gagal memulai streaming kamera: ' + (err.message || ''));
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraRunning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.debug('Error stopping camera:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsCameraRunning(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim(), 'HARDWARE_SCANNER');
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex flex-col max-h-[92vh] w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Scanner Presensi Otomatis
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {targetType === 'STUDENT'
                    ? 'Siswa'
                    : targetType === 'TEACHER'
                    ? 'Guru'
                    : 'Siswa & Guru'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pindai Kartu Pelajar, Kartu Guru, Barcode, QR Code, atau RFID Reader
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                soundEnabled
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Voice Toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Matikan Suara Announcer' : 'Aktifkan Suara Announcer'}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                voiceEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls: Camera vs Hardware Scanner */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-100/50 p-1.5 dark:border-slate-800 dark:bg-slate-800/40">
          <button
            onClick={() => setActiveTab('CAMERA')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'CAMERA'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Camera className="h-4 w-4" />
            Scan Kamera (Webcam / HP)
          </button>
          <button
            onClick={() => setActiveTab('HARDWARE')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'HARDWARE'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Barcode className="h-4 w-4" />
            Hard Scanner (USB / RFID)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Active Result Banner */}
          {lastResult && (
            <div
              className={`rounded-2xl border p-4 transition-all duration-300 animate-in slide-in-from-top-2 ${
                lastResult.status === 'HADIR'
                  ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-800/60 dark:bg-emerald-950/40'
                  : lastResult.status === 'TERLAMBAT'
                  ? 'border-amber-200 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/40'
                  : 'border-blue-200 bg-blue-50/90 dark:border-blue-800/60 dark:bg-blue-950/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs text-white ${
                    lastResult.status === 'HADIR'
                      ? 'bg-emerald-600'
                      : lastResult.status === 'TERLAMBAT'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {lastResult.targetType === 'STUDENT' ? (
                    <GraduationCap className="h-6 w-6" />
                  ) : (
                    <Briefcase className="h-6 w-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        lastResult.status === 'HADIR'
                          ? 'bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : lastResult.status === 'TERLAMBAT'
                          ? 'bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          : 'bg-blue-200/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {lastResult.status} {lastResult.isLate ? '(Terlambat)' : '(Tepat Waktu)'}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs font-bold text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {lastResult.time} WIB
                    </span>
                  </div>

                  <h3 className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                    {lastResult.person.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {lastResult.person.subtext}
                  </p>

                  <p className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {lastResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="flex-1 text-xs">{errorMessage}</p>
            </div>
          )}

          {/* TAB 1: Camera Scanner Viewfinder */}
          {activeTab === 'CAMERA' && (
            <div className="space-y-4">
              <div className="relative mx-auto flex max-h-[340px] w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-400/50 bg-slate-900 shadow-inner">
                {/* Viewfinder Target Container */}
                <div id="camera-reader" className="w-full h-full min-h-[280px]" />

                {/* Laser scan line animation overlay */}
                {isCameraRunning && (
                  <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}

                {!isCameraRunning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-900/80">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                    <p className="text-sm font-medium">Menghubungkan ke sensor kamera...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-300 bg-slate-900/90">
                    <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
                    <p className="text-sm font-semibold">{cameraError}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Pastikan browser telah diizinkan untuk mengakses kamera perangkat.
                    </p>
                  </div>
                )}
              </div>

              {/* Camera Switcher */}
              {cameras.length > 1 && (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Pilih Kamera:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Kamera ${c.id.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Hardware Scanner (Auto Listener) */}
          {activeTab === 'HARDWARE' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-5 dark:border-blue-900/50 dark:from-slate-800/60 dark:to-blue-950/20">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-4 w-4 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Hard Scanner Auto-Listen Aktif
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Hubungkan USB Barcode Gun / RFID Card Reader. Sistem mendeteksi ketukan kartu secara otomatis tanpa perlu klik tombol apapun.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white/90 p-4 border border-blue-100 shadow-xs dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Input Barcode / RFID Manual (Fallback):
                    </span>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                      Tekan Enter untuk memproses
                    </span>
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Scan kartu atau ketik NIS / NISN / NIP..."
                        autoFocus
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-hidden dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || isProcessing}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      <span>Proses</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Recent Scans Session Stream */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Riwayat Pindai Sesi Ini ({recentScans.length})
              </h4>
              {recentScans.length > 0 && (
                <button
                  onClick={() => setRecentScans([])}
                  className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                >
                  Bersihkan Riwayat
                </button>
              )}
            </div>

            {recentScans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
                Belum ada kartu atau barcode yang dipindai pada sesi ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {recentScans.map((item, idx) => (
                  <div
                    key={`${item.person.id}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white font-bold text-[10px] ${
                          item.targetType === 'STUDENT' ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}
                      >
                        {item.targetType === 'STUDENT' ? 'S' : 'G'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.person.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.person.code} • {item.person.subtext}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.status === 'HADIR'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : item.status === 'TERLAMBAT'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kamera & Hard Scanner siap digunakan</span>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Tutup Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
