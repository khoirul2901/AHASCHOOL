import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Smartphone,
  Cpu,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { isWebNfcSupported, nfcManager, formatNfcUid } from '../../utils/nfcHelper.js';
import { playSuccessBeep, playErrorBeep } from '../../utils/audioFeedback.js';

interface NfcRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  personIdentifier: string; // NIS or NIP
  targetType: 'STUDENT' | 'TEACHER';
  currentNfcUid?: string;
  onSave: (newNfcUid: string) => Promise<void>;
}

export const NfcRecordModal: React.FC<NfcRecordModalProps> = ({
  isOpen,
  onClose,
  personName,
  personIdentifier,
  targetType,
  currentNfcUid = '',
  onSave,
}) => {
  const [detectedUid, setDetectedUid] = useState<string>(currentNfcUid);
  const [manualInput, setManualInput] = useState<string>(currentNfcUid);
  const [statusMessage, setStatusMessage] = useState<string>('Mempersiapkan sensor NFC...');
  const [isNfcActive, setIsNfcActive] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const keyBufferRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen) {
      nfcManager.stopScan();
      setIsNfcActive(false);
      return;
    }

    setDetectedUid(currentNfcUid);
    setManualInput(currentNfcUid);
    setErrorMessage(null);

    const hasWebNfc = isWebNfcSupported();

    if (hasWebNfc) {
      setStatusMessage('Tempelkan kartu NFC / e-KTP / Kartu Pelajar ke area NFC perangkat Anda...');
      nfcManager
        .startScan(
          (result) => {
            const uid = result.serialNumber || (result.records?.[0]?.data) || '';
            if (uid) {
              const formatted = formatNfcUid(uid);
              setDetectedUid(formatted);
              setManualInput(formatted);
              setStatusMessage('Kartu NFC berhasil terdeteksi!');
              playSuccessBeep();
            }
          },
          (err) => {
            console.warn('NFC Scan issue:', err);
            setErrorMessage(err.message || 'Sensor NFC tidak merespon.');
          }
        )
        .then((started) => {
          setIsNfcActive(started);
        });
    } else {
      setStatusMessage(
        'Web NFC aktif dalam mode USB Reader / Keyboard Wedge. Tempelkan kartu pada USB NFC reader atau ketik UID secara manual.'
      );
    }

    // Keyboard buffer listener for USB NFC Readers (e.g. ACR122U or USB RFID Reader)
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input, let normal input handle it
      if (document.activeElement?.tagName.toLowerCase() === 'input') {
        return;
      }

      if (e.key === 'Enter') {
        if (keyBufferRef.current.length >= 4) {
          const buffer = keyBufferRef.current.trim();
          keyBufferRef.current = '';
          const formatted = formatNfcUid(buffer);
          setDetectedUid(formatted);
          setManualInput(formatted);
          setStatusMessage('Kartu NFC terdeteksi via USB Reader!');
          playSuccessBeep();
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

    return () => {
      nfcManager.stopScan();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentNfcUid]);

  if (!isOpen) return null;

  const handleConfirmSave = async () => {
    const finalUid = formatNfcUid(detectedUid || manualInput).trim();
    if (!finalUid) {
      setErrorMessage('UID NFC tidak boleh kosong.');
      playErrorBeep();
      return;
    }

    try {
      setIsSaving(true);
      await onSave(finalUid);
      playSuccessBeep();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan UID NFC.');
      playErrorBeep();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearUid = async () => {
    if (confirm('Yakin ingin menghapus tautan kartu NFC untuk ' + personName + '?')) {
      try {
        setIsSaving(true);
        await onSave('');
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal menghapus UID NFC.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Perekaman Kartu NFC
              </h3>
              <p className="text-xs text-slate-500">
                Tautkan chip NFC fisik dengan data {targetType === 'STUDENT' ? 'siswa' : 'guru'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Person Info Badge */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Target {targetType === 'STUDENT' ? 'Siswa' : 'Guru & Pegawai'}
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {personName}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {targetType === 'STUDENT' ? 'NIS' : 'NIP / ID'}
              </span>
              <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {personIdentifier || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Tap Radar Illustration */}
        <div className="my-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center dark:border-indigo-900/60 dark:bg-indigo-950/20">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulses */}
            <span className="absolute h-24 w-24 rounded-full bg-indigo-500/20 animate-ping" />
            <span className="absolute h-16 w-16 rounded-full bg-indigo-500/40 animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Smartphone className="h-8 w-8" />
            </div>
          </div>

          <h5 className="mt-4 text-xs font-bold text-slate-800 dark:text-slate-100">
            {statusMessage}
          </h5>
          <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
            Kompatibel dengan semua jenis kartu NFC (Mifare 1K, NTAG213/215/216, e-KTP, kartu e-money, dan kartu pintar sekolah).
          </p>

          {isWebNfcSupported() ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sensor Web NFC Internal Aktif
            </span>
          ) : (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Cpu className="w-3.5 h-3.5" />
              Mendukung USB NFC Reader & Input Manual
            </span>
          )}
        </div>

        {/* Detected UID Field */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hasil Deteksi UID Kartu NFC
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="UID akan muncul otomatis saat kartu di-tap (cth: 04:A2:3F:B1:2C)"
                  value={manualInput}
                  onChange={(e) => {
                    const formatted = formatNfcUid(e.target.value);
                    setManualInput(formatted);
                    setDetectedUid(formatted);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm font-bold text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {manualInput && (
                <button
                  type="button"
                  onClick={() => {
                    setManualInput('');
                    setDetectedUid('');
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div>
            {currentNfcUid && (
              <button
                type="button"
                onClick={handleClearUid}
                disabled={isSaving}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                Hapus Tautan NFC
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={!manualInput.trim() || isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tautkan Kartu NFC</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
