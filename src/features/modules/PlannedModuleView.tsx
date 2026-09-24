import React from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';
import type { NavTab } from '../../components/layout/Sidebar.js';

interface PlannedModuleViewProps {
  tab: NavTab;
  onNavigate: (tab: NavTab) => void;
}

const MODULE_DETAILS: Record<
  string,
  {
    name: string;
    code: string;
    description: string;
    subFeatures: string[];
    integrationPoints: string[];
    schemaEntities: string[];
  }
> = {
  'mod-kesiswaan': {
    name: 'Kesiswaan (Mutasi, Prestasi & Pelanggaran)',
    code: 'KESISWAAN',
    description:
      'Manajemen rekam jejak siswa mencakup pencatatan prestasi akademik/non-akademik, buku poin pelanggaran tata tertib sekolah, riwayat mutasi masuk/keluar, dan konseling BK terintegrasi.',
    subFeatures: [
      'Pencatatan & Verifikasi Prestasi Siswa (Tingkat Kota, Provinsi, Nasional)',
      'Sistem Poin Pelanggaran & Surat Peringatan Otomatis',
      'Riwayat Mutasi Siswa (Surat Pindah Masuk & Keluar)',
      'Buku Catatan Bimbingan Konseling (BK)',
    ],
    integrationPoints: [
      'Terhubung langsung dengan Master Data Siswa & Kelas',
      'Menerima data ketidakhadiran (Alpha/Bolos) dari Modul Absensi untuk deteksi dini siswa bermasalah',
      'Terhubung dengan Modul Komunikasi untuk notifikasi orang tua',
    ],
    schemaEntities: ['student_achievements', 'student_violations', 'student_transfers', 'counseling_sessions'],
  },
  'mod-akademik': {
    name: 'Akademik (Penilaian, Kurikulum Merdeka & E-Rapor)',
    code: 'AKADEMIK',
    description:
      'Pengelolaan bobot nilai formatif/sumatif, capaian pembelajaran (CP), tujuan pembelajaran (TP), dan cetak rapor Kurikulum Merdeka.',
    subFeatures: [
      'Input Nilai Harian / Asesmen Formatif & Sumatif',
      'Bank Soal & Penjadwalan Ujian Sekolah',
      'Generasi Otomatis Rapor Kurikulum Merdeka & K13',
      'Kenaikan Kelas & Kelulusan Terpadu',
    ],
    integrationPoints: [
      'Mengambil data kehadiran siswa dari Modul Absensi untuk rekap persentase kehadiran di rapor',
      'Menggunakan jadwal mengajar untuk pembagian kelas pengampu',
    ],
    schemaEntities: ['assessments', 'assessment_scores', 'report_cards', 'learning_objectives'],
  },
  'mod-kepegawaian': {
    name: 'Kepegawaian (HRD, Penggajian & Pengajuan Cuti)',
    code: 'KEPEGAWAIAN',
    description:
      'Manajemen berkas kepegawaian guru/staf, pengajuan cuti online terintegrasi pengganti mengajar, dan rekap jam mengajar untuk tunjangan.',
    subFeatures: [
      'Pengajuan Cuti Online & Workflow Persetujuan Kepala Sekolah',
      'Otomasi Pengalihan Jadwal ke Guru Pengganti saat Cuti Disetujui',
      'Rekapitulasi Jam Mengajar Realistis dari Data Absensi',
      'Portofolio & Sertifikasi Pendidik',
    ],
    integrationPoints: [
      'Sinkronisasi langsung dengan Jadwal Piket & Mengajar',
      'Absensi Guru menjadi dasar validasi kehadiran dan rekap honorarium',
    ],
    schemaEntities: ['leave_requests', 'teacher_contracts', 'payroll_records', 'teacher_certifications'],
  },
  'mod-keuangan': {
    name: 'Keuangan & Pembayaran SPP Terpadu',
    code: 'KEUANGAN',
    description:
      'Pencatatan tagihan SPP, iuran ekstrakurikuler, kas sekolah, dan integrasi payment gateway / virtual account.',
    subFeatures: [
      'Billing & Tagihan SPP Bulanan Otomatis',
      'Kwitansi Pembayaran Digital & Rekap Kasir',
      'Laporan Realisasi Anggaran Sekolah',
      'Integrasi Virtual Account Bank',
    ],
    integrationPoints: [
      'Terhubung dengan NIS siswa dan data rombel aktif',
      'Status lunas SPP dapat dijadikan syarat cetak kartu ujian di Modul Akademik',
    ],
    schemaEntities: ['invoices', 'payment_transactions', 'fee_structures', 'school_accounts'],
  },
  'mod-sarpras': {
    name: 'Sarana & Prasarana (Aset & Inventaris)',
    code: 'SARPRAS',
    description:
      'Inventarisasi fasilitas kelas, laboratorium, proyektor, peminjaman barang, dan jadwal perawatan berkala.',
    subFeatures: [
      'Katalog Aset Ruangan & Kode Inventaris QR Code',
      'Sistem Peminjaman Proyektor / Lab oleh Guru',
      'Tiket Laporan Kerusakan Fasilitas Sekolah',
    ],
    integrationPoints: [
      'Validasi ketersediaan ruangan saat pembuatan Jadwal Mengajar',
      'Guru piket dapat mencatat fasilitas rusak saat patroli harian',
    ],
    schemaEntities: ['rooms', 'assets', 'asset_loans', 'maintenance_tickets'],
  },
  'mod-perpustakaan': {
    name: 'Perpustakaan Digital (Katalog & Sirkulasi)',
    code: 'PERPUSTAKAAN',
    description:
      'Katalog buku fisik dan e-book, barcode peminjaman menggunakan kartu pelajar, dan denda keterlambatan.',
    subFeatures: [
      'Katalog Buku & Pencarian Judul/Pengarang',
      'Peminjaman Cepat dengan Barcode Kartu Pelajar',
      'Notifikasi Otomatis Jatuh Tempo',
    ],
    integrationPoints: ['Menggunakan barcode ID dari Master Siswa & Guru'],
    schemaEntities: ['books', 'book_loans', 'library_members'],
  },
  'mod-ppdb': {
    name: 'PPDB Online (Penerimaan Peserta Didik Baru)',
    code: 'PPDB',
    description:
      'Portal pendaftaran calon siswa, jalur zonasi, prestasi, dan afirmasi, seleksi berkas, hingga mutasi jadi siswa aktif.',
    subFeatures: [
      'Formulir Pendaftaran Calon Siswa Online',
      'Verifikasi Dokumen KK & Akta Kelahiran',
      'Perhitungan Poin Zonasi / Prestasi',
      'Migrasi 1-Klik Calon Siswa Menjadi Siswa Kelas 7',
    ],
    integrationPoints: ['Langsung meng-insert data ke Master Data Siswa saat penetapan kelulusan'],
    schemaEntities: ['applicants', 'applicant_documents', 'selection_results'],
  },
  'mod-surat': {
    name: 'Tata Usaha (Surat Masuk, Keluar & Disposisi)',
    code: 'PERSURATAN',
    description:
      'Administrasi surat dinas, penomoran surat otomatis sekolah, pengarsipan digital, dan lembar disposisi kepala sekolah.',
    subFeatures: [
      'Penomoran Surat Otomatis Berdasarkan Klasifikasi',
      'Pencatatan Surat Masuk & Pengunggahan Berkas PDF',
      'Disposisi Digital Kepala Sekolah ke Wakil / Guru',
    ],
    integrationPoints: ['Daftar penerima disposisi terhubung ke Master Data Guru & Pegawai'],
    schemaEntities: ['incoming_letters', 'outgoing_letters', 'letter_dispositions'],
  },
  'mod-komunikasi': {
    name: 'Komunikasi & Notifikasi Terpadu (WhatsApp / SMS)',
    code: 'KOMUNIKASI',
    description:
      'Notifikasi otomatis kehadiran siswa ke WhatsApp orang tua, pengumuman sekolah, dan buletin agenda.',
    subFeatures: [
      'Kirim Notifikasi Realtime Siswa Masuk / Tidak Hadir ke WhatsApp Orang Tua',
      'Pengumuman Libur / Informasi Sekolah Massal',
      'Pemberitahuan Tagihan & Agenda Rapat Komite',
    ],
    integrationPoints: [
      'Dijalankan sebagai background worker dari event presensi di AttendanceEngine',
    ],
    schemaEntities: ['notification_logs', 'broadcast_templates', 'broadcast_messages'],
  },
};

export const PlannedModuleView: React.FC<PlannedModuleViewProps> = ({ tab, onNavigate }) => {
  const details = MODULE_DETAILS[tab] || {
    name: 'Modul Ekstensi Terpadu',
    code: tab.toUpperCase(),
    description: 'Modul dalam perancangan arsitektur Modular Monolith.',
    subFeatures: [],
    integrationPoints: [],
    schemaEntities: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs font-mono font-bold text-blue-800 dark:text-blue-300">
                {details.code}
              </span>
              <span className="flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Arsitektur Terencana Modular Monolith
              </span>
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
              {details.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl leading-relaxed">
              {details.description}
            </p>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <span>Kembali ke Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Pillars of Module Specification */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Sub-Features */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Fitur & Alur Kerja Utama</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {details.subFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pillar 2: Core Integration Points */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Integrasi Modul Inti (Absensi & Jadwal)</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {details.integrationPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pillar 3: Database Entities */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Skema Entitas Database Terkait</span>
            </div>
            <div className="space-y-1.5">
              {details.schemaEntities.map((ent, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300"
                >
                  <FileCode2 className="w-3 h-3 text-indigo-500" />
                  <span>{ent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
