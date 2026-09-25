import React, { useState, useEffect } from 'react';
import heroSchoolBuilding from '../../assets/images/hero_school_building_1790150623062.jpg';
import schoolPrincipalPortrait from '../../assets/images/school_principal_portrait_1790150661629.jpg';
import schoolLibraryStem from '../../assets/images/school_library_stem_1790150644800.jpg';
import {
  GraduationCap,
  Award,
  Users,
  Calendar,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronRight,
  School,
  Building,
  QrCode,
  ScanLine,
} from 'lucide-react';

interface SchoolLandingPageProps {
  onNavigateLogin: () => void;
  onNavigateScannerKiosk: () => void;
}

export const SchoolLandingPage: React.FC<SchoolLandingPageProps> = ({
  onNavigateLogin,
  onNavigateScannerKiosk,
}) => {
  const [stats, setStats] = useState({
    totalStudents: 384,
    totalTeachers: 28,
    totalClasses: 12,
    accreditation: 'A (Unggul)',
    npsn: '20261984',
  });

  const [activeTab, setActiveTab] = useState<'profil' | 'program' | 'fasilitas' | 'prestasi'>('profil');

  useEffect(() => {
    // Avoid fetching API on static GitHub Pages to prevent 404 console errors
    if (typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:')) {
      return;
    }
    // Fetch live counts if available on backend server
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.school?.npsn) {
          setStats((prev) => ({
            ...prev,
            npsn: data.school.npsn || '20261984',
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP BAR CONTRACT: Exactly 3 Zones (Brand single text, 4-5 links, 1-2 actions) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
              ST
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                SMP Negeri 1 Indonesia Terpadu
              </span>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                NPSN: {stats.npsn} · Terakreditasi {stats.accreditation}
              </div>
            </div>
          </div>

          {/* Zone 2: 4-5 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#tentang" className="hover:text-blue-600 transition-colors">Tentang Kami</a>
            <a href="#keunggulan" className="hover:text-blue-600 transition-colors">Program & Kurikulum</a>
            <a href="#fasilitas" className="hover:text-blue-600 transition-colors">Fasilitas</a>
            <a href="#prestasi" className="hover:text-blue-600 transition-colors">Prestasi</a>
            <a href="#kontak" className="hover:text-blue-600 transition-colors">Kontak</a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onNavigateScannerKiosk}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Buka Mesin Presensi Gate"
            >
              <ScanLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Gate Scanner</span>
            </button>

            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition whitespace-nowrap"
            >
              <span>Portal SIAKAD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white py-16 sm:py-24">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 -z-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Pendidikan Karakter & Keunggulan Iptek Terpadu</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Membentuk Generasi Berkarakter, Berakhlak Mulia & Berprestasi Global
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Lembaga pendidikan formal rujukan nasional yang memadukan kurikulum Merdeka Berkarakter, penguasaan sains teknologi modern, serta ekosistem digital terintegrasi untuk kenyamanan siswa, guru, dan orang tua.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onNavigateLogin}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-white text-sm shadow-lg shadow-blue-500/25 transition"
                >
                  <span>Masuk Portal Guru & Siswa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onNavigateScannerKiosk}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 font-medium text-slate-200 text-sm transition"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>Kiosk Presensi RFID / Barcode</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-2xl font-black text-white tabular-nums">380+</div>
                  <div className="text-xs text-slate-400">Siswa Aktif</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tabular-nums">100%</div>
                  <div className="text-xs text-slate-400">Kelulusan Lanjutan</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tabular-nums">28</div>
                  <div className="text-xs text-slate-400">Pendidik Bersertifikasi</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800">
                <img
                  src={heroSchoolBuilding}
                  alt="Gedung Kampus Sekolah Terpadu"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="text-sm font-bold">Kampus Hijau Ramah Lingkungan</div>
                    <div className="text-xs text-slate-300">Dilengkapi Smart Classroom, Laboratorium STEM & Masjid Terpadu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SAMBUTAN KEPALA SEKOLAH & PROFIL */}
      <section id="tentang" className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Principal Photo Card */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-50">
                <img
                  src={schoolPrincipalPortrait}
                  alt="Kepala Sekolah SMP Negeri 1 Indonesia Terpadu"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 object-cover object-top"
                />
                <div className="p-4 text-center border-t border-slate-200">
                  <div className="text-base font-bold text-slate-900">Dr. H. Muhammad Ilyas, M.Pd.</div>
                  <div className="text-xs text-blue-600 font-medium">Kepala Sekolah & Pembina Akademik</div>
                </div>
              </div>
            </div>

            {/* Principal Speech & Vision Mission */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Sambutan Kepala Sekolah
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                "Pendidikan Berkualitas Dimulai dari Keteladanan, Karakter, dan Disiplin"
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Selamat datang di situs resmi SMP Negeri 1 Indonesia Terpadu. Kami meyakini bahwa setiap anak memiliki potensi mulia yang siap mekar ketika dibimbing dalam lingkungan yang saling menghargai, kaya ilmu pengetahuan, dan menjunjung tinggi nilai-nilai kejujuran.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Melalui digitalisasi terintegrasi (SIAKAD), kami menghadirkan transparansi penuh bagi para wali murid untuk memantau kehadiran, nilai akademik, serta perkembangan akhlak siswa secara real-time.
              </p>

              {/* Visi & Misi Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Visi Sekolah</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    Menjadi sentra pendidikan unggulan yang mencetak insan bertaqwa, berakhlak mulia, berprestasi di kancah sains & teknologi, serta peduli kelestarian lingkungan.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>Misi Utama</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    Melaksanakan pembelajaran interaktif berbasis riset, menguatkan literasi Al-Qur'an dan kebangsaan, serta memberdayakan sarana teknologi digital ramah anak.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROGRAM UNGGULAN & KURIKULUM */}
      <section id="keunggulan" className="py-16 bg-slate-100/60 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Program Unggulan
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kurikulum Holistik Terpadu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Keseimbangan antara kecerdasan intelektual (IQ), emosional (EQ), dan spiritual (SQ)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                01. Sains & STEM Robotic Lab
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pembelajaran sains terapan dengan praktek langsung di laboratorium komputer dan robotika untuk menumbuhkan nalar kritis dan pemecahan masalah sejak dini.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                02. Tahfidz & Penguatan Karakter
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Bimbingan hafalan Al-Qur'an tartil, pembiasaan shalat berjamaah, serta pendampingan adab dan kepemimpinan oleh guru pembina berdedikasi.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                03. Smart Digital Presence
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kartu pelajar terintegrasi RFID dan Barcode untuk pencatatan presensi akurat di gerbang, perpustakaan, dan katering sekolah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FASILITAS PEMBELAJARAN */}
      <section id="fasilitas" className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Sarana & Prasarana
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Fasilitas Modern Penunjang Kreativitas Siswa
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Kami menyediakan ruang belajar yang nyaman dan kondusif untuk memacu eksplorasi siswa di bidang akademik maupun minat bakat non-akademik.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Perpustakaan Digital & Ruang Baca Tenang</div>
                    <div className="text-xs text-slate-500">Ribuan koleksi literatur fisik dan e-book dengan akses internet super cepat.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Laboratorium IPA & Komputer Multimedia</div>
                    <div className="text-xs text-slate-500">Perangkat komputer spesifikasi tinggi dan peralatan lab sains bersertifikasi aman.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Gelanggang Olahraga & Lapangan Futsal/Basket</div>
                    <div className="text-xs text-slate-500">Sarana kebugaran jasmani indoor dan outdoor yang aman dan terawat.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
                <img
                  src={schoolLibraryStem}
                  alt="Perpustakaan dan Laboratorium Digital Sekolah"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION PORTAL */}
      <section className="bg-slate-900 text-white py-14 border-t border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Akses Layanan Akademik Sekolah Terpadu
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Masuk ke SIAKAD untuk mengelola absensi kelas, rekap nilai siswa, jadwal mengajar guru, serta arsip data sekolah.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onNavigateLogin}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <span>Buka Halaman Login SIAKAD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateScannerKiosk}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 text-sm transition flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <span>Buka Mesin Scan Gate</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. QUIET FOOTER */}
      <footer id="kontak" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2 md:col-span-2">
              <div className="text-white font-bold text-base">SMP Negeri 1 Indonesia Terpadu</div>
              <p className="text-slate-400 max-w-md">
                Jl. Pendidikan Terpadu No. 10, Jakarta / Nusantara. Sekolah Berwawasan Lingkungan & Terakreditasi Unggul Kemendikbudristek.
              </p>
              <div className="text-slate-500 pt-2">
                NPSN: 20261984 · NSS: 201016001001
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Tautan Cepat</div>
              <ul className="space-y-2">
                <li><a href="#tentang" className="hover:text-white transition">Profil Sekolah</a></li>
                <li><a href="#keunggulan" className="hover:text-white transition">Kurikulum Terpadu</a></li>
                <li><a href="#fasilitas" className="hover:text-white transition">Fasilitas Kampus</a></li>
                <li><button onClick={onNavigateLogin} className="hover:text-blue-400 transition text-left">Login SIAKAD</button></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Kontak & Sekretariat</div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>(021) 7890-1234</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>sekretariat@sekolah.sch.id</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Senin - Jumat: 07:00 - 15:30</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500">
            <div>© 2026 SMP Negeri 1 Indonesia Terpadu. Seluruh hak cipta dilindungi.</div>
            <div>Sistem Informasi Akademik & Presensi Cerdas v1.0</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
