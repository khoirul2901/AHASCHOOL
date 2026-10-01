import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Building,
  UserCheck,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Briefcase,
  Trash2,
  Shield,
  Edit2,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type {
  TeachingSchedule,
  PicketSchedule,
  ManagementSchedule,
  TeacherItem,
  ClassItem,
  SubjectItem,
  LessonPeriodSlot,
  UserSession,
} from '../../types/index.js';

interface TeachingScheduleViewProps {
  currentSession: UserSession | null;
}

export const TeachingScheduleView: React.FC<TeachingScheduleViewProps> = ({
  currentSession,
}) => {
  const [activeTab, setActiveTab] = useState<'TEACHING' | 'PICKET' | 'MANAGEMENT'>('TEACHING');
  const [teachingSchedules, setTeachingSchedules] = useState<TeachingSchedule[]>([]);
  const [picketSchedules, setPicketSchedules] = useState<PicketSchedule[]>([]);
  const [managementSchedules, setManagementSchedules] = useState<ManagementSchedule[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [lessonPeriods, setLessonPeriods] = useState<LessonPeriodSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAddTeaching, setShowAddTeaching] = useState(false);
  const [showAddPicket, setShowAddPicket] = useState(false);
  const [showAddManagement, setShowAddManagement] = useState(false);

  // Edit IDs
  const [editingTeachingId, setEditingTeachingId] = useState<string | null>(null);
  const [editingPicketId, setEditingPicketId] = useState<string | null>(null);

  // JP Slot selector mode
  const [useJpTime, setUseJpTime] = useState(true);
  const [startJp, setStartJp] = useState<number>(1);
  const [endJp, setEndJp] = useState<number>(2);

  // Filters for Teaching Schedule
  const [filterDay, setFilterDay] = useState<number>(0); // 0 = Semua Hari
  const [filterClass, setFilterClass] = useState<string>('ALL'); // 'ALL' or classId
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Form states
  const [teachingForm, setTeachingForm] = useState({
    teacherId: '',
    classId: '',
    subjectId: '',
    dayOfWeek: 1,
    startTime: '07:15',
    endTime: '08:15',
    startPeriod: 1,
    endPeriod: 2,
    periodCount: 2,
    room: 'R. 101',
  });

  const [picketForm, setPicketForm] = useState({
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '14:00',
    location: 'Pos Lobby Utama',
  });

  const [managementForm, setManagementForm] = useState({
    teacherId: '',
    roleTitle: 'Waka Kurikulum',
    dayOfWeek: 0,
    startTime: '07:00',
    endTime: '15:00',
    roomOrDesk: 'Ruang Waka Kurikulum',
    description: 'Pengelolaan KBM harian, kurikulum, dan evaluasi pembelajaran',
  });

  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const handleJpChange = (newStart: number, newEnd: number, periodsList?: LessonPeriodSlot[]) => {
    const list = periodsList || lessonPeriods;
    const activeLessons = list.filter((lp) => !lp.isBreak);
    const startSlot = activeLessons.find((p) => p.periodNumber === newStart) || activeLessons[0];
    const endSlot = activeLessons.find((p) => p.periodNumber === newEnd) || startSlot || activeLessons[activeLessons.length - 1];

    if (startSlot && endSlot) {
      const pCount = Math.max(1, newEnd - newStart + 1);
      setStartJp(newStart);
      setEndJp(newEnd);
      setTeachingForm((prev) => ({
        ...prev,
        startTime: startSlot.startTime,
        endTime: endSlot.endTime,
        startPeriod: newStart,
        endPeriod: newEnd,
        periodCount: pCount,
      }));
    }
  };

  const filteredTeachingSchedules = teachingSchedules.filter((sch) => {
    if (filterDay > 0 && sch.dayOfWeek !== filterDay) return false;
    if (filterClass !== 'ALL' && sch.classId !== filterClass) return false;
    if (filterSearch.trim() !== '') {
      const q = filterSearch.toLowerCase();
      const teacherMatch = (sch.teacher?.name || sch.teacherName || '').toLowerCase().includes(q);
      const subjectMatch = (sch.subject?.name || sch.subjectName || '').toLowerCase().includes(q);
      const roomMatch = (sch.room || '').toLowerCase().includes(q);
      const classMatch = (sch.class?.name || sch.className || '').toLowerCase().includes(q);
      if (!teacherMatch && !subjectMatch && !roomMatch && !classMatch) return false;
    }
    return true;
  });

  const isFiltered = filterDay > 0 || filterClass !== 'ALL' || filterSearch.trim() !== '';

  const handleResetFilters = () => {
    setFilterDay(0);
    setFilterClass('ALL');
    setFilterSearch('');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes, mRes, tchRes, clsRes, sbjRes, jpRes] = await Promise.all([
        fetch('/api/schedules/teaching'),
        fetch('/api/schedules/picket'),
        fetch('/api/schedules/management'),
        fetch('/api/teachers'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/academic/lesson-periods'),
      ]);

      if (tRes.ok) setTeachingSchedules(await tRes.json());
      if (pRes.ok) setPicketSchedules(await pRes.json());
      if (mRes.ok) setManagementSchedules(await mRes.json());
      if (tchRes.ok) {
        const data = await tchRes.json();
        setTeachers(data.items || []);
        if (data.items?.length > 0) {
          setTeachingForm((prev) => ({ ...prev, teacherId: data.items[0].id }));
          setPicketForm((prev) => ({ ...prev, teacherId: data.items[0].id }));
          setManagementForm((prev) => ({ ...prev, teacherId: data.items[0].id }));
        }
      }
      if (clsRes.ok) {
        const clsData = await clsRes.json();
        setClasses(clsData);
        if (clsData.length > 0) {
          setTeachingForm((prev) => ({ ...prev, classId: clsData[0].id }));
        }
      }
      if (sbjRes.ok) {
        const sbjData = await sbjRes.json();
        setSubjects(sbjData);
        if (sbjData.length > 0) {
          setTeachingForm((prev) => ({ ...prev, subjectId: sbjData[0].id }));
        }
      }
      if (jpRes.ok) {
        const jps: LessonPeriodSlot[] = await jpRes.json();
        setLessonPeriods(jps);
        const activeKbm = jps.filter((p) => !p.isBreak);
        if (activeKbm.length >= 2) {
          const s1 = activeKbm[0].periodNumber;
          const s2 = activeKbm[1].periodNumber;
          setStartJp(s1);
          setEndJp(s2);
          setTeachingForm((prev) => ({
            ...prev,
            startTime: activeKbm[0].startTime,
            endTime: activeKbm[1].endTime,
            startPeriod: s1,
            endPeriod: s2,
            periodCount: 2,
          }));
        } else if (activeKbm.length === 1) {
          setStartJp(activeKbm[0].periodNumber);
          setEndJp(activeKbm[0].periodNumber);
          setTeachingForm((prev) => ({
            ...prev,
            startTime: activeKbm[0].startTime,
            endTime: activeKbm[0].endTime,
            startPeriod: activeKbm[0].periodNumber,
            endPeriod: activeKbm[0].periodNumber,
            periodCount: 1,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddTeaching = () => {
    setEditingTeachingId(null);
    const activeKbm = lessonPeriods.filter((p) => !p.isBreak);
    const s1 = activeKbm.length > 0 ? activeKbm[0].periodNumber : 1;
    const s2 = activeKbm.length > 1 ? activeKbm[1].periodNumber : s1;
    setStartJp(s1);
    setEndJp(s2);
    setUseJpTime(true);
    setTeachingForm({
      teacherId: teachers.length > 0 ? teachers[0].id : '',
      classId: classes.length > 0 ? classes[0].id : '',
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      dayOfWeek: 1,
      startTime: activeKbm.length > 0 ? activeKbm[0].startTime : '07:15',
      endTime: activeKbm.length > 1 ? activeKbm[1].endTime : '08:15',
      startPeriod: s1,
      endPeriod: s2,
      periodCount: Math.max(1, s2 - s1 + 1),
      room: 'R. 101',
    });
    setShowAddTeaching(true);
  };

  const handleOpenEditTeaching = (sch: TeachingSchedule) => {
    setEditingTeachingId(sch.id);
    const startP = sch.startPeriod || 1;
    const endP = sch.endPeriod || 2;
    setStartJp(startP);
    setEndJp(endP);
    setUseJpTime(!!(sch.startPeriod && sch.endPeriod));
    setTeachingForm({
      teacherId: sch.teacherId,
      classId: sch.classId,
      subjectId: sch.subjectId,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      startPeriod: startP,
      endPeriod: endP,
      periodCount: sch.periodCount || Math.max(1, endP - startP + 1),
      room: sch.room || '',
    });
    setShowAddTeaching(true);
  };

  const handleSaveTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const url = editingTeachingId
        ? `/api/schedules/teaching/${editingTeachingId}`
        : '/api/schedules/teaching';
      const method = editingTeachingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(teachingForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan jadwal mengajar' });
        return;
      }

      setMessage({
        type: 'success',
        text: editingTeachingId
          ? 'Jadwal mengajar berhasil diperbarui!'
          : 'Jadwal mengajar berhasil ditambahkan!',
      });
      setShowAddTeaching(false);
      setEditingTeachingId(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTeaching = async (sch: TeachingSchedule) => {
    const teacherName = sch.teacher?.name || sch.teacherName || 'Guru';
    const subName = sch.subject?.name || sch.subjectName || 'Mapel';
    const clsName = sch.class?.name || sch.className || 'Kelas';
    const dayName = dayNames[sch.dayOfWeek] || '';
    if (
      !confirm(
        `Hapus jadwal mengajar:\n${teacherName} - ${subName} (${clsName})\nHari ${dayName}, jam ${sch.startTime} - ${sch.endTime}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/schedules/teaching/${sch.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus jadwal mengajar.');
      }

      setMessage({
        type: 'success',
        text: `Jadwal mengajar ${teacherName} (${subName}) berhasil dihapus.`,
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenAddPicket = () => {
    setEditingPicketId(null);
    setPicketForm({
      teacherId: teachers.length > 0 ? teachers[0].id : '',
      date: new Date().toISOString().split('T')[0],
      startTime: '07:00',
      endTime: '14:00',
      location: 'Pos Lobby Utama',
    });
    setShowAddPicket(true);
  };

  const handleOpenEditPicket = (pkt: PicketSchedule) => {
    setEditingPicketId(pkt.id);
    setPicketForm({
      teacherId: pkt.teacherId,
      date: pkt.date,
      startTime: pkt.startTime,
      endTime: pkt.endTime,
      location: pkt.location || 'Pos Lobby Utama',
    });
    setShowAddPicket(true);
  };

  const handleSavePicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const url = editingPicketId
        ? `/api/schedules/picket/${editingPicketId}`
        : '/api/schedules/picket';
      const method = editingPicketId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(picketForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan jadwal piket' });
        return;
      }

      setMessage({
        type: 'success',
        text: editingPicketId
          ? 'Jadwal piket berhasil diperbarui!'
          : 'Jadwal piket berhasil ditambahkan!',
      });
      setShowAddPicket(false);
      setEditingPicketId(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeletePicket = async (pkt: PicketSchedule) => {
    const teacherName = pkt.teacher?.name || pkt.teacherName || 'Guru';
    if (
      !confirm(
        `Hapus jadwal piket untuk ${teacherName} pada tanggal ${pkt.date} (${pkt.startTime} - ${pkt.endTime})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/schedules/picket/${pkt.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus jadwal piket.');
      }

      setMessage({ type: 'success', text: `Jadwal piket ${teacherName} berhasil dihapus.` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateManagement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch('/api/schedules/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(managementForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal menambahkan tugas manajemen' });
        return;
      }

      setMessage({ type: 'success', text: 'Jadwal tugas manajemen berhasil ditambahkan!' });
      setShowAddManagement(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteManagement = async (id: string) => {
    if (!confirm('Yakin ingin menghapus penugasan tugas manajemen ini?')) return;
    try {
      setMessage(null);
      const res = await fetch(`/api/schedules/management/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Gagal menghapus tugas manajemen' });
        return;
      }

      setMessage({ type: 'success', text: 'Tugas manajemen berhasil dihapus.' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span>Manajemen Jadwal Mengajar, Piket & Jadwal Manajemen</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dilengkapi validasi bentrok jadwal guru, bentrok kelas, dan bentrok ruangan secara otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'TEACHING' && (
              <button
                onClick={handleOpenAddTeaching}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Mengajar</span>
              </button>
            )}
            {activeTab === 'PICKET' && (
              <button
                onClick={handleOpenAddPicket}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Piket</span>
              </button>
            )}
            {activeTab === 'MANAGEMENT' && (
              <button
                onClick={() => setShowAddManagement(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Manajemen</span>
              </button>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="underline ml-2">
              Tutup
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('TEACHING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'TEACHING'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Jadwal Mengajar ({teachingSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('PICKET')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'PICKET'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Jadwal Piket Guru ({picketSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('MANAGEMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'MANAGEMENT'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Jadwal Manajemen ({managementSchedules.length})
          </button>
        </div>
      </div>

      {/* Content for TAB 1: TEACHING SCHEDULE */}
      {activeTab === 'TEACHING' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filter:</span>
                </div>

                {/* Filter Hari */}
                <div className="min-w-[130px]">
                  <select
                    value={filterDay}
                    onChange={(e) => setFilterDay(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Semua Hari</option>
                    <option value={1}>Senin</option>
                    <option value={2}>Selasa</option>
                    <option value={3}>Rabu</option>
                    <option value={4}>Kamis</option>
                    <option value={5}>Jumat</option>
                    <option value={6}>Sabtu</option>
                  </select>
                </div>

                {/* Filter Kelas */}
                <div className="min-w-[140px]">
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Reset Filter */}
                {isFiltered && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                    title="Reset Semua Filter"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari guru, mapel, atau ruang..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filterSearch && (
                  <button
                    onClick={() => setFilterSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Summary and Day Chips */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-slate-500 flex items-center gap-2">
                <span>
                  Menampilkan <strong>{filteredTeachingSchedules.length}</strong> dari{' '}
                  <strong>{teachingSchedules.length}</strong> jadwal mengajar
                </span>
                {isFiltered && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    Filter Aktif
                  </span>
                )}
              </div>

              {/* Quick Day Chips for 1-click day filter */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {[
                  { id: 0, label: 'Semua' },
                  { id: 1, label: 'Senin' },
                  { id: 2, label: 'Selasa' },
                  { id: 3, label: 'Rabu' },
                  { id: 4, label: 'Kamis' },
                  { id: 5, label: 'Jumat' },
                  { id: 6, label: 'Sabtu' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setFilterDay(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      filterDay === d.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">Memuat data jadwal...</div>
            ) : teachingSchedules.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada jadwal mengajar.
              </div>
            ) : filteredTeachingSchedules.length === 0 ? (
              <div className="p-12 text-center text-xs space-y-2">
                <p className="text-slate-500 font-medium">
                  Tidak ada jadwal mengajar yang sesuai dengan filter yang dipilih.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Hari</th>
                      <th className="px-4 py-3 font-semibold">Waktu</th>
                      <th className="px-4 py-3 font-semibold">Kelas</th>
                      <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                      <th className="px-4 py-3 font-semibold">Guru Pengampu</th>
                      <th className="px-4 py-3 font-semibold">Ruangan</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTeachingSchedules.map((sch) => (
                    <tr
                      key={sch.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {dayNames[sch.dayOfWeek]}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-slate-900 dark:text-white">{sch.startTime} - {sch.endTime}</div>
                        {sch.startPeriod && sch.endPeriod ? (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            JP {sch.startPeriod} s/d {sch.endPeriod} ({sch.periodCount || (sch.endPeriod - sch.startPeriod + 1)} JP)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {sch.class?.name || sch.className || sch.classId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {sch.subject?.name || sch.subjectName || sch.subjectId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {sch.teacher?.name || sch.teacherName || sch.teacherId}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{sch.room || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditTeaching(sch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                            title="Edit Jadwal Mengajar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeaching(sch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Hapus Jadwal Mengajar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* Content for TAB 2: PICKET SCHEDULE */}
      {activeTab === 'PICKET' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Memuat data piket...</div>
          ) : picketSchedules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada jadwal piket.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Nama Guru Piket</th>
                    <th className="px-4 py-3 font-semibold">Jam Piket</th>
                    <th className="px-4 py-3 font-semibold">Lokasi Tugas</th>
                    <th className="px-4 py-3 font-semibold">Status Record</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {picketSchedules.map((pkt) => (
                    <tr
                      key={pkt.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {pkt.date}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {pkt.teacher?.name || pkt.teacherName || pkt.teacherId}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {pkt.startTime} - {pkt.endTime}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {pkt.location || 'Pos Utama'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          PIKET AKTIF
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditPicket(pkt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                            title="Edit Jadwal Piket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePicket(pkt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Hapus Jadwal Piket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content for TAB 3: MANAGEMENT SCHEDULE */}
      {activeTab === 'MANAGEMENT' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Memuat data jadwal manajemen...</div>
          ) : managementSchedules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada jadwal penugasan manajemen sekolah. Klik "Tambah Jadwal Manajemen" untuk menambahkan penugasan waka, kepala lab, koordinator, dll.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama Guru</th>
                    <th className="px-4 py-3 font-semibold">Tugas / Jabatan Manajemen</th>
                    <th className="px-4 py-3 font-semibold">Hari Tugas</th>
                    <th className="px-4 py-3 font-semibold">Jam Kerja</th>
                    <th className="px-4 py-3 font-semibold">Ruangan / Meja</th>
                    <th className="px-4 py-3 font-semibold">Uraian Tugas</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {managementSchedules.map((mgmt) => (
                    <tr
                      key={mgmt.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {mgmt.teacher?.name || mgmt.teacherName || mgmt.teacherId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                          {mgmt.roleTitle}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {mgmt.dayOfWeek && mgmt.dayOfWeek > 0
                          ? dayNames[mgmt.dayOfWeek]
                          : 'Semua Hari Kerja'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {mgmt.startTime} - {mgmt.endTime}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {mgmt.roomOrDesk || 'Ruang Manajemen'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {mgmt.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteManagement(mgmt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Hapus Penugasan Manajemen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah/Edit Jadwal Mengajar */}
      <Modal
        isOpen={showAddTeaching}
        onClose={() => {
          setShowAddTeaching(false);
          setEditingTeachingId(null);
        }}
        title={editingTeachingId ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTeaching} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Guru Pengampu
              </label>
              <select
                value={teachingForm.teacherId}
                onChange={(e) => setTeachingForm({ ...teachingForm, teacherId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelas
              </label>
              <select
                value={teachingForm.classId}
                onChange={(e) => setTeachingForm({ ...teachingForm, classId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={teachingForm.subjectId}
                onChange={(e) => setTeachingForm({ ...teachingForm, subjectId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hari
              </label>
              <select
                value={teachingForm.dayOfWeek}
                onChange={(e) =>
                  setTeachingForm({ ...teachingForm, dayOfWeek: parseInt(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
                <option value={6}>Sabtu</option>
              </select>
            </div>

            {/* Pilihan Waktu KBM Berdasarkan Jam Pelajaran (JP) */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={useJpTime}
                    onChange={(e) => setUseJpTime(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Pilih Waktu Berdasarkan Jam Pelajaran (JP)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Referensi Otomatis dari Master Mapel
                </span>
              </div>

              {useJpTime ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mulai Jam Ke-
                      </label>
                      <select
                        value={startJp}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const nextEnd = val > endJp ? val : endJp;
                          handleJpChange(val, nextEnd);
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {lessonPeriods
                          .filter((lp) => !lp.isBreak)
                          .map((lp) => (
                            <option key={lp.id} value={lp.periodNumber}>
                              Jam Ke-{lp.periodNumber} ({lp.startTime} - {lp.endTime})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sampai Jam Ke-
                      </label>
                      <select
                        value={endJp}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const nextStart = val < startJp ? val : startJp;
                          handleJpChange(nextStart, val);
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {lessonPeriods
                          .filter((lp) => !lp.isBreak)
                          .map((lp) => (
                            <option
                              key={lp.id}
                              value={lp.periodNumber}
                              disabled={lp.periodNumber < startJp}
                            >
                              Jam Ke-{lp.periodNumber} ({lp.startTime} - {lp.endTime})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/40 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold text-blue-900 dark:text-blue-300">
                        Waktu KBM Terhitung Otomatis:
                      </div>
                      <div className="text-sm font-bold font-mono text-blue-700 dark:text-blue-400">
                        {teachingForm.startTime} - {teachingForm.endTime}
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Jam Ke-{teachingForm.startPeriod || startJp} s/d {teachingForm.endPeriod || endJp} ({teachingForm.periodCount || (endJp - startJp + 1)} JP)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Manual Input Fallback */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jam Mulai (Manual)
                    </label>
                    <input
                      type="time"
                      value={teachingForm.startTime}
                      onChange={(e) =>
                        setTeachingForm({ ...teachingForm, startTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jam Selesai (Manual)
                    </label>
                    <input
                      type="time"
                      value={teachingForm.endTime}
                      onChange={(e) =>
                        setTeachingForm({ ...teachingForm, endTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ruangan Kelas / Lab
              </label>
              <input
                type="text"
                placeholder="Contoh: R. 201 / Lab Komputer"
                value={teachingForm.room}
                onChange={(e) => setTeachingForm({ ...teachingForm, room: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddTeaching(false);
                setEditingTeachingId(null);
              }}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
            >
              {editingTeachingId ? 'Simpan Perubahan Jadwal' : 'Simpan Jadwal Mengajar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah/Edit Jadwal Piket */}
      <Modal
        isOpen={showAddPicket}
        onClose={() => {
          setShowAddPicket(false);
          setEditingPicketId(null);
        }}
        title={editingPicketId ? 'Edit Jadwal Piket Guru' : 'Tambah Jadwal Piket Guru'}
      >
        <form onSubmit={handleSavePicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Guru Piket
            </label>
            <select
              value={picketForm.teacherId}
              onChange={(e) => setPicketForm({ ...picketForm, teacherId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Tugas Piket
            </label>
            <input
              type="date"
              value={picketForm.date}
              onChange={(e) => setPicketForm({ ...picketForm, date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                value={picketForm.startTime}
                onChange={(e) => setPicketForm({ ...picketForm, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                value={picketForm.endTime}
                onChange={(e) => setPicketForm({ ...picketForm, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi Pos Piket
            </label>
            <input
              type="text"
              value={picketForm.location}
              onChange={(e) => setPicketForm({ ...picketForm, location: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddPicket(false);
                setEditingPicketId(null);
              }}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              {editingPicketId ? 'Simpan Perubahan Piket' : 'Simpan Jadwal Piket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Jadwal Manajemen */}
      <Modal
        isOpen={showAddManagement}
        onClose={() => setShowAddManagement(false)}
        title="Tambah Jadwal Tugas Manajemen Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateManagement} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Guru yang Ditugaskan
              </label>
              <select
                value={managementForm.teacherId}
                onChange={(e) => setManagementForm({ ...managementForm, teacherId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan / Peran Manajemen
              </label>
              <input
                type="text"
                list="roles-list"
                value={managementForm.roleTitle}
                onChange={(e) => setManagementForm({ ...managementForm, roleTitle: e.target.value })}
                placeholder="Contoh: Waka Kurikulum, Waka Kesiswaan..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
              <datalist id="roles-list">
                <option value="Waka Kurikulum" />
                <option value="Waka Kesiswaan" />
                <option value="Waka Sarana & Prasarana" />
                <option value="Waka Humas" />
                <option value="Kepala Laboratorium Komputer" />
                <option value="Kepala Perpustakaan" />
                <option value="Koordinator Bimbingan Konseling (BK)" />
                <option value="Pembina OSIS" />
                <option value="Tim Penjamin Mutu Pendidikan" />
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hari Pelaksanaan Tugas
              </label>
              <select
                value={managementForm.dayOfWeek}
                onChange={(e) => setManagementForm({ ...managementForm, dayOfWeek: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value={0}>Semua Hari Kerja (Senin - Sabtu)</option>
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
                <option value={6}>Sabtu</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ruangan / Meja Kerja
              </label>
              <input
                type="text"
                value={managementForm.roomOrDesk}
                onChange={(e) => setManagementForm({ ...managementForm, roomOrDesk: e.target.value })}
                placeholder="Contoh: Ruang Waka / Meja Manajemen"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai Tugas
              </label>
              <input
                type="time"
                value={managementForm.startTime}
                onChange={(e) => setManagementForm({ ...managementForm, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai Tugas
              </label>
              <input
                type="time"
                value={managementForm.endTime}
                onChange={(e) => setManagementForm({ ...managementForm, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Uraian & Lingkup Tugas Manajemen
              </label>
              <textarea
                rows={2}
                value={managementForm.description}
                onChange={(e) => setManagementForm({ ...managementForm, description: e.target.value })}
                placeholder="Deskripsi tugas dan tanggung jawab manajemen..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddManagement(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-purple-700"
            >
              Simpan Jadwal Manajemen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
