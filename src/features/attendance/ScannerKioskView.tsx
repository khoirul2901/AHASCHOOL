import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Barcode,
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
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  Maximize2,
  History,
  QrCode,
  Flame,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  playSuccessBeep,
  playDuplicateBeep,
  playErrorBeep,
  announceAttendanceVoice,
} from '../../utils/audioFeedback.js';
import type { ScanAttendanceResult, UserSession } from '../../types/index.js';

interface ScannerKioskViewProps {
  currentSession: UserSession | null;
}

export const ScannerKioskView: React.FC<ScannerKioskViewProps> = ({ currentSession }) => {
  const [activeMode, setActiveMode] = useState<'CAMERA' | 'HARDWARE' | 'DUAL'>('DUAL');
  const [targetFilter, setTargetFilter] = useState<'AUTO' | 'STUDENT' | 'TEACHER'>('AUTO');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Time & Date state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Camera State
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Hardware Scanner & Scans State
  const [manualCode, setManualCode] = useState('');
  const [lastResult, setLastResult] = useState<ScanAttendanceResult | null>(null);
  const [scannedHistory, setScannedHistory] = useState<ScanAttendanceResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stats Counters
  const [todayStats, setTodayStats] = useState({
    totalScanned: 0,
    presentOnTime: 0,
    lateCount: 0,
  });

  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const isCooldownRef = useRef<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Process code logic
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

      const userId = currentSession?.id || currentSession?.user?.id || 'kiosk';
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          code,
          type: targetFilter,
          method,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (soundEnabled) playErrorBeep();
        setErrorMessage(data.error || 'Barcode / QR / RFID tidak terdaftar.');
        setLastResult(null);
      } else {
        const scanRes = data as ScanAttendanceResult;
        setLastResult(scanRes);
        setScannedHistory((prev) => [scanRes, ...prev.slice(0, 19)]);

        // Update session counters
        setTodayStats((prev) => ({
          totalScanned: prev.totalScanned + 1,
          presentOnTime:
            scanRes.status === 'HADIR' ? prev.presentOnTime + 1 : prev.presentOnTime,
          lateCount:
            scanRes.status === 'TERLAMBAT' ? prev.lateCount + 1 : prev.lateCount,
        }));

        // Audio & Voice feedback
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
      }
    } catch (err: any) {
      if (soundEnabled) playErrorBeep();
      setErrorMessage('Terjadi kendala scanner: ' + err.message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 1500);
    }
  };

  // Hardware Scanner Keyboard Wedge Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (keyBufferRef.current.length >= 3) {
          const buffer = keyBufferRef.current;
          keyBufferRef.current = '';
          handleProcessCode(buffer, 'HARDWARE_SCANNER');
          e.preventDefault();
          return;
        }
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

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
  }, [isProcessing, targetFilter, soundEnabled, voiceEnabled]);

  // Camera Initializer
  useEffect(() => {
    if (activeMode === 'HARDWARE') {
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
          setCameraError('Kamera tidak terdeteksi.');
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraError('Izin kamera ditolak atau tidak tersedia: ' + err.message);
        }
      }
    };

    const timer = setTimeout(() => {
      initCamera();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [activeMode]);

  const startCamera = async (cameraId: string) => {
    try {
      await stopCamera();
      const el = document.getElementById('kiosk-camera-reader');
      if (!el) return;

      const html5QrCode = new Html5Qrcode('kiosk-camera-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 12,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleProcessCode(decodedText, 'CAMERA');
        },
        () => {}
      );

      setIsCameraRunning(true);
      setCameraError(null);
    } catch (err: any) {
      setIsCameraRunning(false);
      setCameraError('Gagal menjalankan kamera: ' + err.message);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraRunning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.debug('Error stopping kiosk camera:', err);
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

  return (
    <div className="space-y-6">
      {/* Kiosk Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <QrCode className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                Mesin Scan Absensi (Kiosk Pos Gerbang)
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Standby
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mendukung kamera HP/Webcam dan Hard Scanner USB / RFID otomatis tanpa jeda.
            </p>
          </div>
        </div>

        {/* Live Clock & Academic Date */}
        <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          <div className="text-right">
            <div className="font-mono text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
              {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentTime.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip & Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mode Selector */}
        <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Metode Pindai Aktif
          </span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setActiveMode('DUAL')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'DUAL'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Dual Mode
            </button>
            <button
              onClick={() => setActiveMode('CAMERA')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'CAMERA'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kamera
            </button>
            <button
              onClick={() => setActiveMode('HARDWARE')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'HARDWARE'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Hard Scan
            </button>
          </div>
        </div>

        {/* Target Filter */}
        <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Target Presensi
          </span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setTargetFilter('AUTO')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                targetFilter === 'AUTO'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTargetFilter('STUDENT')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                targetFilter === 'STUDENT'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Siswa
            </button>
            <button
              onClick={() => setTargetFilter('TEACHER')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                targetFilter === 'TEACHER'
                  ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Guru
            </button>
          </div>
        </div>

        {/* Counter: Total Scanned */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Dipindai Sesi Ini
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-slate-800 dark:text-slate-100">
              {todayStats.totalScanned}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Audio & Feedback Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audio Feedback
            </span>
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                  soundEnabled
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 text-slate-400 dark:border-slate-700'
                }`}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                Beep
              </button>

              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                  voiceEnabled
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-400 dark:border-slate-700'
                }`}
              >
                {voiceEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                Suara
              </button>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Kiosk Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder & Hard Scanner Radar */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Result Card if Scanned */}
          {lastResult && (
            <div
              className={`rounded-2xl border-2 p-6 shadow-md transition-all duration-300 animate-in slide-in-from-top-4 ${
                lastResult.status === 'HADIR'
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40'
                  : lastResult.status === 'TERLAMBAT'
                  ? 'border-amber-500 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40'
                  : 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl shadow-md text-white ${
                    lastResult.status === 'HADIR'
                      ? 'bg-emerald-600'
                      : lastResult.status === 'TERLAMBAT'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {lastResult.targetType === 'STUDENT' ? (
                    <GraduationCap className="h-10 w-10" />
                  ) : (
                    <Briefcase className="h-10 w-10" />
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black ${
                        lastResult.status === 'HADIR'
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200'
                          : lastResult.status === 'TERLAMBAT'
                          ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                          : 'bg-blue-200 text-blue-900 dark:bg-blue-900/80 dark:text-blue-200'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {lastResult.status} {lastResult.isLate ? '(TERLAMBAT)' : '(TEPAT WAKTU)'}
                    </span>

                    <span className="font-mono text-sm font-bold text-slate-600 dark:text-slate-300">
                      Pukul {lastResult.time} WIB
                    </span>
                  </div>

                  <h2 className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">
                    {lastResult.person.name}
                  </h2>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {lastResult.person.subtext}
                  </p>

                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 py-1.5 px-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>{lastResult.message}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Viewfinder Area */}
          {(activeMode === 'CAMERA' || activeMode === 'DUAL') && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    Sensor Kamera Scanner
                  </h3>
                </div>

                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Kamera ${c.id.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="relative mx-auto flex h-[320px] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-500/40 bg-slate-950 shadow-inner">
                <div id="kiosk-camera-reader" className="w-full h-full min-h-[300px]" />

                {isCameraRunning && (
                  <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse" />
                )}

                {!isCameraRunning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-950/80">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                    <p className="text-sm font-semibold">Menginisialisasi Kamera Pos Gerbang...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-300 bg-slate-950/90">
                    <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
                    <p className="text-sm font-bold">{cameraError}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Kamera tidak dapat diakses. Anda tetap dapat menggunakan Hard Scanner USB / RFID.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hard Scanner Radar / Input */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-6 dark:border-blue-900/50 dark:from-slate-800/60 dark:to-blue-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Hard Scanner Auto-Listen Aktif
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      SIAP PINDAI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Cukup tap kartu RFID atau tembak barcode kartu dengan Barcode Gun USB/Bluetooth.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/90 p-4 border border-blue-100 shadow-xs dark:bg-slate-800 dark:border-slate-700">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Input manual barcode / RFID / NISN jika kartu rusak..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-hidden dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  Proses
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Attendees Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  Antrean Kehadiran Hari Ini
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-500">
                {scannedHistory.length} Masuk
              </span>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 max-h-[550px]">
              {scannedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <QrCode className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Belum Ada Kartu Yang Dipindai
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Dekatkan kartu barcode/RFID ke alat scanner atau hadapkan QR kartu ke kamera.
                  </p>
                </div>
              ) : (
                scannedHistory.map((item, idx) => (
                  <div
                    key={`${item.person.id}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs shadow-xs ${
                          item.targetType === 'STUDENT' ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}
                      >
                        {item.targetType === 'STUDENT' ? 'S' : 'G'}
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.person.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {item.person.subtext}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          item.status === 'HADIR'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : item.status === 'TERLAMBAT'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                        }`}
                      >
                        {item.status}
                      </span>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5 font-semibold">
                        {item.time} WIB
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
