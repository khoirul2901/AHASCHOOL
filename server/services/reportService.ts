import { dbManager } from '../db/database.js';

export class ReportService {
  /**
   * 1. Laporan Absensi Siswa Lengkap dengan Filter Ekstensif
   */
  public static getStudentReport(params: {
    startDate?: string;
    endDate?: string;
    classId?: string;
    gradeLevel?: string;
    status?: string;
    method?: string;
    gender?: string;
    session?: string; // 'ALL' | 'MASUK' | 'PULANG' | 'SUDAH_PULANG' | 'BELUM_PULANG'
    search?: string;
  }) {
    const store = dbManager.getStore();
    let records = store.studentAttendance.filter((a) => !a.deletedAt);

    if (params.startDate) {
      records = records.filter((a) => a.attendanceDate >= params.startDate!);
    }
    if (params.endDate) {
      records = records.filter((a) => a.attendanceDate <= params.endDate!);
    }
    if (params.classId) {
      records = records.filter((a) => a.classId === params.classId);
    }
    if (params.status) {
      records = records.filter((a) => a.status === params.status);
    }

    let mapped = records.map((a) => {
      const student = store.students.find((s) => s.id === a.studentId);
      const cls = store.classes.find((c) => c.id === a.classId);
      
      let methodLabel = 'Lainnya';
      if (a.note?.includes('NFC') || a.originDeviceId === 'nfc') methodLabel = 'NFC';
      else if (a.note?.includes('Hard Scanner') || a.note?.includes('Laser')) methodLabel = 'Hard Scanner Laser';
      else if (a.note?.includes('Kamera')) methodLabel = 'Kamera';
      else if (a.note?.includes('Manual')) methodLabel = 'Manual';

      const checkIn = a.checkInTime || a.actualTime || '-';
      const checkOut = a.checkOutTime || '-';
      const hasCheckedIn = checkIn !== '-';
      const hasCheckedOut = checkOut !== '-';

      return {
        id: a.id,
        date: a.attendanceDate,
        studentId: a.studentId,
        studentNis: student ? student.nis : '-',
        studentNisn: student ? student.nisn || '-' : '-',
        studentName: student ? student.name : 'Unknown',
        gender: student ? student.gender : '-',
        classId: a.classId,
        className: cls ? cls.name : '-',
        gradeLevel: cls ? cls.level || cls.name.split('-')[0].replace(/[^0-9]/g, '') : '',
        status: a.status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        hasCheckedIn,
        hasCheckedOut,
        method: methodLabel,
        note: a.note || '-',
      };
    });

    if (params.gradeLevel) {
      mapped = mapped.filter((r) => r.gradeLevel === params.gradeLevel || r.className.includes(params.gradeLevel!));
    }

    if (params.gender) {
      mapped = mapped.filter((r) => r.gender === params.gender);
    }

    if (params.method) {
      mapped = mapped.filter((r) => r.method.toLowerCase().includes(params.method!.toLowerCase()));
    }

    if (params.session) {
      if (params.session === 'MASUK') {
        mapped = mapped.filter((r) => r.hasCheckedIn);
      } else if (params.session === 'PULANG') {
        mapped = mapped.filter((r) => r.hasCheckedOut);
      } else if (params.session === 'SUDAH_PULANG') {
        mapped = mapped.filter((r) => r.hasCheckedOut);
      } else if (params.session === 'BELUM_PULANG') {
        mapped = mapped.filter((r) => (r.status === 'HADIR' || r.status === 'TERLAMBAT') && !r.hasCheckedOut);
      }
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      mapped = mapped.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentNis.toLowerCase().includes(q) ||
          r.studentNisn.toLowerCase().includes(q) ||
          r.className.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q)
      );
    }

    // Sort by date desc, then student name asc
    mapped.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : a.studentName.localeCompare(b.studentName)));

    return mapped;
  }

  /**
   * 2. Laporan Rekapitulasi Kehadiran Per Kelas & Per Siswa
   */
  public static getClassSummaryReport(params: {
    startDate?: string;
    endDate?: string;
    classId?: string;
    gradeLevel?: string;
  }) {
    const store = dbManager.getStore();
    let students = store.students.filter(
      (s) => !s.deletedAt && (!params.classId || s.classId === params.classId)
    );

    if (params.gradeLevel) {
      students = students.filter((s) => {
        const cls = store.classes.find((c) => c.id === s.classId);
        return cls && (cls.level === params.gradeLevel || cls.name.includes(params.gradeLevel!));
      });
    }

    let attendances = store.studentAttendance.filter((a) => !a.deletedAt);
    if (params.startDate) {
      attendances = attendances.filter((a) => a.attendanceDate >= params.startDate!);
    }
    if (params.endDate) {
      attendances = attendances.filter((a) => a.attendanceDate <= params.endDate!);
    }

    // Unique dates in the period
    const uniqueDates = Array.from(new Set(attendances.map((a) => a.attendanceDate)));
    const totalDays = Math.max(uniqueDates.length, 1);

    const summaries = students.map((s) => {
      const cls = store.classes.find((c) => c.id === s.classId);
      const studentRecords = attendances.filter((a) => a.studentId === s.id);

      const hadirCount = studentRecords.filter((a) => a.status === 'HADIR').length;
      const terlambatCount = studentRecords.filter((a) => a.status === 'TERLAMBAT').length;
      const sakitCount = studentRecords.filter((a) => a.status === 'SAKIT').length;
      const izinCount = studentRecords.filter((a) => a.status === 'IZIN').length;
      const alphaCount = studentRecords.filter((a) => a.status === 'ALPHA').length;
      const totalRecorded = studentRecords.length;

      // Rate: Hadir + Terlambat / totalDays
      const presentTotal = hadirCount + terlambatCount;
      const attendanceRate = totalDays > 0 ? Math.round((presentTotal / totalDays) * 100) : 100;

      return {
        studentId: s.id,
        nis: s.nis,
        name: s.name,
        gender: s.gender,
        classId: s.classId,
        className: cls ? cls.name : '-',
        gradeLevel: cls ? cls.level || cls.name.split('-')[0].replace(/[^0-9]/g, '') : '',
        totalDays,
        hadirCount,
        terlambatCount,
        sakitCount,
        izinCount,
        alphaCount,
        totalRecorded,
        attendanceRate: Math.min(attendanceRate, 100),
      };
    });

    summaries.sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));

    return {
      period: {
        startDate: params.startDate,
        endDate: params.endDate,
        totalEffectiveDays: totalDays,
      },
      items: summaries,
    };
  }

  /**
   * 3. Laporan Absensi Guru & Pegawai
   */
  public static getTeacherReport(params: {
    startDate?: string;
    endDate?: string;
    teacherId?: string;
    type?: string;
    status?: string;
    method?: string;
    gender?: string;
    employmentStatus?: string;
    session?: string; // 'ALL' | 'SUDAH_PULANG' | 'BELUM_PULANG'
    search?: string;
  }) {
    const store = dbManager.getStore();
    let records = store.teacherAttendance.filter((a) => !a.deletedAt);

    if (params.startDate) {
      records = records.filter((a) => a.attendanceDate >= params.startDate!);
    }
    if (params.endDate) {
      records = records.filter((a) => a.attendanceDate <= params.endDate!);
    }
    if (params.teacherId) {
      records = records.filter((a) => a.teacherId === params.teacherId);
    }
    if (params.type) {
      records = records.filter((a) => a.attendanceType === params.type);
    }
    if (params.status) {
      records = records.filter((a) => a.status === params.status);
    }

    let mapped = records.map((a) => {
      const teacher = store.teachers.find((t) => t.id === a.teacherId);
      let methodLabel = 'Lainnya';
      if (a.note?.includes('NFC')) methodLabel = 'NFC';
      else if (a.note?.includes('Hard Scanner') || a.note?.includes('Laser')) methodLabel = 'Hard Scanner Laser';
      else if (a.note?.includes('Kamera')) methodLabel = 'Kamera';
      else if (a.note?.includes('Manual')) methodLabel = 'Manual';

      const checkIn = a.actualTime || '-';
      const checkOut = a.checkOutTime || '-';
      const hasCheckedOut = checkOut !== '-';

      return {
        id: a.id,
        date: a.attendanceDate,
        teacherId: a.teacherId,
        teacherNip: teacher?.nip || '-',
        teacherName: teacher ? teacher.name : 'Unknown',
        gender: teacher ? teacher.gender : '-',
        subject: teacher?.subject || '-',
        employmentStatus: teacher?.employmentStatus || 'GURU_TETAP',
        type: a.attendanceType === 'TEACHING' ? 'Mengajar' : 'Piket',
        scheduled: `${a.scheduledStart} - ${a.scheduledEnd}`,
        actualTime: checkIn,
        checkOutTime: checkOut,
        hasCheckedOut,
        status: a.status,
        method: methodLabel,
        source: a.source,
        note: a.note || '-',
      };
    });

    if (params.method) {
      mapped = mapped.filter((r) => r.method.toLowerCase().includes(params.method!.toLowerCase()));
    }

    if (params.employmentStatus) {
      mapped = mapped.filter((r) => r.employmentStatus === params.employmentStatus);
    }

    if (params.gender) {
      mapped = mapped.filter((r) => r.gender === params.gender);
    }

    if (params.session) {
      if (params.session === 'SUDAH_PULANG') {
        mapped = mapped.filter((r) => r.hasCheckedOut);
      } else if (params.session === 'BELUM_PULANG') {
        mapped = mapped.filter((r) => (r.status === 'HADIR' || r.status === 'TERLAMBAT') && !r.hasCheckedOut);
      }
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      mapped = mapped.filter(
        (r) =>
          r.teacherName.toLowerCase().includes(q) ||
          r.teacherNip.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q)
      );
    }

    mapped.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : a.teacherName.localeCompare(b.teacherName)));

    return mapped;
  }

  /**
   * 4. Laporan Presensi Sholat Dhuha (Siswa & Guru)
   */
  public static getDhuhaReport(params: {
    startDate?: string;
    endDate?: string;
    targetType?: 'ALL' | 'STUDENT' | 'TEACHER';
    classId?: string;
    gradeLevel?: string;
    status?: string;
    method?: string;
    gender?: string;
    search?: string;
  }) {
    const store = dbManager.getStore();
    let records = (store.dhuhaAttendance || []).slice();

    if (params.startDate) {
      records = records.filter((d) => d.date >= params.startDate!);
    }
    if (params.endDate) {
      records = records.filter((d) => d.date <= params.endDate!);
    }
    if (params.targetType && params.targetType !== 'ALL') {
      records = records.filter((d) => d.targetType === params.targetType);
    }
    if (params.status) {
      records = records.filter((d) => d.status === params.status);
    }
    if (params.gender) {
      records = records.filter((d) => d.gender === params.gender);
    }

    let mapped = records.map((d) => {
      let clsName = d.classOrSubject;
      let grade = '';
      if (d.targetType === 'STUDENT') {
        const s = store.students.find((stu) => stu.id === d.personId);
        if (s && s.classId) {
          const cls = store.classes.find((c) => c.id === s.classId);
          if (cls) {
            clsName = `Kelas ${cls.name}`;
            grade = cls.level || cls.name.split('-')[0].replace(/[^0-9]/g, '');
          }
        }
      }

      let methodLabel = 'Lainnya';
      if (d.note?.includes('NFC')) methodLabel = 'NFC';
      else if (d.note?.includes('Hard Scanner') || d.note?.includes('Laser')) methodLabel = 'Hard Scanner Laser';
      else if (d.note?.includes('Kamera')) methodLabel = 'Kamera';
      else if (d.note?.includes('Manual')) methodLabel = 'Manual';

      return {
        id: d.id,
        date: d.date,
        time: d.time || '-',
        personId: d.personId,
        name: d.name,
        identifier: d.identifier,
        targetType: d.targetType,
        gender: d.gender,
        classOrSubject: clsName,
        gradeLevel: grade,
        status: d.status,
        method: methodLabel,
        note: d.note || '-',
      };
    });

    if (params.classId) {
      mapped = mapped.filter((r) => {
        if (r.targetType !== 'STUDENT') return false;
        const s = store.students.find((stu) => stu.id === r.personId);
        return s?.classId === params.classId;
      });
    }

    if (params.gradeLevel) {
      mapped = mapped.filter((r) => r.gradeLevel === params.gradeLevel || r.classOrSubject.includes(params.gradeLevel!));
    }

    if (params.method) {
      mapped = mapped.filter((r) => r.method.toLowerCase().includes(params.method!.toLowerCase()));
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      mapped = mapped.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.identifier.toLowerCase().includes(q) ||
          r.classOrSubject.toLowerCase().includes(q)
      );
    }

    mapped.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : a.name.localeCompare(b.name)));

    return mapped;
  }

  /**
   * 5. Laporan Jadwal Pelajaran
   */
  public static getScheduleReport(params: {
    day?: string;
    classId?: string;
    teacherId?: string;
    gradeLevel?: string;
  }) {
    const store = dbManager.getStore();
    let schedules = store.teachingSchedules.slice();

    if (params.day) {
      schedules = schedules.filter((s) => s.day === params.day);
    }
    if (params.classId) {
      schedules = schedules.filter((s) => s.classId === params.classId);
    }
    if (params.teacherId) {
      schedules = schedules.filter((s) => s.teacherId === params.teacherId);
    }

    let mapped = schedules.map((s) => {
      const cls = store.classes.find((c) => c.id === s.classId);
      const teacher = store.teachers.find((t) => t.id === s.teacherId);
      const subject = store.subjects.find((sub) => sub.id === s.subjectId);

      return {
        id: s.id,
        day: s.day,
        period: s.period,
        time: `${s.startTime} - ${s.endTime}`,
        className: cls ? cls.name : '-',
        gradeLevel: cls ? cls.level || cls.name.split('-')[0].replace(/[^0-9]/g, '') : '',
        teacherName: teacher ? teacher.name : '-',
        teacherNip: teacher?.nip || '-',
        subjectName: subject ? subject.name : '-',
        subjectCode: subject?.code || '-',
        room: s.room || '-',
      };
    });

    if (params.gradeLevel) {
      mapped = mapped.filter((r) => r.gradeLevel === params.gradeLevel || r.className.includes(params.gradeLevel!));
    }

    return mapped;
  }

  /**
   * 6. Laporan Jurnal & KBM Mengajar Guru
   */
  public static getJournalReport(params: {
    startDate?: string;
    endDate?: string;
    classId?: string;
    teacherId?: string;
    search?: string;
  }) {
    const store = dbManager.getStore();
    let records = store.teacherAttendance.filter((a) => !a.deletedAt && a.attendanceType === 'TEACHING');

    if (params.startDate) {
      records = records.filter((a) => a.attendanceDate >= params.startDate!);
    }
    if (params.endDate) {
      records = records.filter((a) => a.attendanceDate <= params.endDate!);
    }
    if (params.teacherId) {
      records = records.filter((a) => a.teacherId === params.teacherId);
    }

    let mapped = records.map((a) => {
      const teacher = store.teachers.find((t) => t.id === a.teacherId);
      const schedule = a.scheduleId ? store.teachingSchedules.find((s) => s.id === a.scheduleId) : null;
      const cls = schedule ? store.classes.find((c) => c.id === schedule.classId) : null;
      const sbj = schedule ? store.subjects.find((s) => s.id === schedule.subjectId) : null;

      return {
        id: a.id,
        date: a.attendanceDate,
        teacherName: teacher?.name || 'Unknown',
        teacherNip: teacher?.nip || '-',
        className: cls ? cls.name : 'Kelas Umum',
        classId: cls ? cls.id : '',
        subjectName: sbj ? sbj.name : (teacher?.subject || '-'),
        scheduledTime: `${a.scheduledStart} - ${a.scheduledEnd}`,
        actualInTime: a.actualTime || '-',
        actualOutTime: a.checkOutTime || '-',
        status: a.status,
        topic: a.note || 'KBM Berjalan Sesuai Silabus',
        source: a.source,
      };
    });

    if (params.classId) {
      mapped = mapped.filter((r) => r.classId === params.classId);
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      mapped = mapped.filter(
        (r) =>
          r.teacherName.toLowerCase().includes(q) ||
          r.className.toLowerCase().includes(q) ||
          r.subjectName.toLowerCase().includes(q) ||
          r.topic.toLowerCase().includes(q)
      );
    }

    mapped.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : a.teacherName.localeCompare(b.teacherName)));

    return mapped;
  }

  /**
   * Helper Export CSV
   */
  public static exportToCsv(data: any[], headers: { key: string; label: string }[]): string {
    const headerRow = headers.map((h) => `"${h.label}"`).join(',');
    const bodyRows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    return [headerRow, ...bodyRows].join('\n');
  }
}
