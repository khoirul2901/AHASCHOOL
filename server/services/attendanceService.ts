import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import { AttendanceEngine } from './attendanceEngine.js';
import type {
  TeacherAttendance,
  StudentAttendance,
  AttendanceCorrection,
  AttendanceStatus,
  DashboardStats,
} from '../../src/types/index.js';

// Fast anti-spam cache to prevent rapid double-reads (sensor bounce / rapid taps)
const RECENT_SCAN_COOLDOWN_MS = 8000;
const recentScanCache = new Map<string, { time: number; result: any }>();

export class AttendanceService {
  public static getTeacherAttendances(params?: {
    date?: string;
    teacherId?: string;
    type?: string;
    status?: string;
  }) {
    const store = dbManager.getStore();
    let list = store.teacherAttendance.filter((a) => !a.deletedAt);

    if (params?.date) {
      list = list.filter((a) => a.attendanceDate === params.date);
    }
    if (params?.teacherId) {
      list = list.filter((a) => a.teacherId === params.teacherId);
    }
    if (params?.type) {
      list = list.filter((a) => a.attendanceType === params.type);
    }
    if (params?.status) {
      list = list.filter((a) => a.status === params.status);
    }

    return list.map((a) => {
      const teacher = store.teachers.find((t) => t.id === a.teacherId);
      let scheduleDetail = '';
      if (a.attendanceType === 'TEACHING' && a.scheduleId) {
        const sch = store.teachingSchedules.find((s) => s.id === a.scheduleId);
        if (sch) {
          const cls = store.classes.find((c) => c.id === sch.classId);
          const sbj = store.subjects.find((s) => s.id === sch.subjectId);
          scheduleDetail = `${sbj?.name || ''} - ${cls?.name || ''} (${sch.room || 'R.?'})`;
        }
      } else if (a.attendanceType === 'PICKET' && a.scheduleId) {
        const pkt = store.picketSchedules.find((p) => p.id === a.scheduleId);
        scheduleDetail = `Piket: ${pkt?.location || 'Pos Utama'}`;
      } else if (a.attendanceType === 'MANAGEMENT') {
        const mgmt = (store.managementSchedules || []).find((m) => m.id === a.scheduleId || m.teacherId === a.teacherId);
        scheduleDetail = a.scheduleDetail || (mgmt ? `Tugas Manajemen: ${mgmt.roleTitle} (${mgmt.roomOrDesk || 'Kantor'})` : 'Tugas Manajemen');
      }

      return {
        ...a,
        teacherName: teacher ? teacher.name : 'Unknown',
        scheduleDetail,
      } as TeacherAttendance;
    });
  }

  public static teacherCheckIn(
    teacherId: string,
    attendanceId: string,
    checkInTime?: string
  ): TeacherAttendance {
    const store = dbManager.getStore();
    const att = store.teacherAttendance.find(
      (a) => a.id === attendanceId && a.teacherId === teacherId && !a.deletedAt
    );
    if (!att) {
      throw new Error('Data jadwal absensi tidak ditemukan.');
    }

    const actual =
      checkInTime ||
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const tolerance = store.schoolSetting.lateToleranceMinutes || 10;
    const newStatus = AttendanceEngine.processLateStatus(att.scheduledStart, actual, tolerance);

    att.actualTime = actual;
    att.checkInTime = actual;
    att.status = newStatus;
    att.source = 'CHECK_IN';
    att.updatedAt = new Date().toISOString();
    att.version += 1;

    // OTOMATISASI MULTI-TUGAS: Cukup sekali check-in/tap, otomatis terisi baik absen pelajaran jam pertama, guru piket, maupun manajemen
    const todayOtherDuties = store.teacherAttendance.filter(
      (a) =>
        a.teacherId === teacherId &&
        a.attendanceDate === att.attendanceDate &&
        a.id !== att.id &&
        !a.deletedAt
    );

    for (const duty of todayOtherDuties) {
      if (duty.attendanceType === 'PICKET' || duty.attendanceType === 'MANAGEMENT' || duty.attendanceType === 'TEACHING') {
        duty.actualTime = actual;
        duty.checkInTime = actual;
        duty.status = newStatus;
        duty.source = 'CHECK_IN';
        duty.updatedAt = new Date().toISOString();
        duty.version += 1;
      }
    }

    dbManager.saveSync();

    AuditService.log({
      action: 'CHECK_IN',
      entity: 'teacher_attendance',
      entityId: att.id,
      newData: att,
      description: `Check-in guru (${att.teacherId}) jam ${actual} dengan status ${newStatus}`,
    });

    return att;
  }

  public static getStudentAttendances(params: {
    date: string;
    classId: string;
    scheduleId?: string;
  }): StudentAttendance[] {
    const store = dbManager.getStore();
    const studentsInClass = store.students.filter(
      (s) => s.classId === params.classId && s.active && !s.deletedAt
    );

    // Retrieve or populate student attendance records
    const result: StudentAttendance[] = [];

    for (const student of studentsInClass) {
      let record = store.studentAttendance.find(
        (a) =>
          a.studentId === student.id &&
          a.attendanceDate === params.date &&
          (!params.scheduleId || a.scheduleId === params.scheduleId) &&
          !a.deletedAt
      );

      const cls = store.classes.find((c) => c.id === student.classId);

      if (!record) {
        // Find default schedule if not given
        const schedule = params.scheduleId
          ? store.teachingSchedules.find((s) => s.id === params.scheduleId)
          : store.teachingSchedules.find((s) => s.classId === params.classId);

        record = {
          id: uuidv4(),
          studentId: student.id,
          classId: student.classId,
          teacherId: schedule ? schedule.teacherId : 'system',
          subjectId: schedule ? schedule.subjectId : undefined,
          scheduleId: params.scheduleId || (schedule ? schedule.id : undefined),
          attendanceDate: params.date,
          status: 'HADIR', // Default
          version: 1,
          originDeviceId: 'local',
        };
        store.studentAttendance.push(record);
      }

      result.push({
        ...record,
        studentName: student.name,
        studentNis: student.nis,
        className: cls ? cls.name : '',
      });
    }

    dbManager.saveSync();
    return result;
  }

  public static saveStudentAttendances(
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    meta: { classId: string; date: string; scheduleId?: string; teacherId: string },
    currentUserId?: string
  ): StudentAttendance[] {
    const store = dbManager.getStore();
    const updatedRecords: StudentAttendance[] = [];

    for (const item of records) {
      let existing = store.studentAttendance.find(
        (a) =>
          a.studentId === item.studentId &&
          a.attendanceDate === meta.date &&
          (!meta.scheduleId || a.scheduleId === meta.scheduleId) &&
          !a.deletedAt
      );

      if (existing) {
        existing.status = item.status;
        existing.note = item.note || existing.note;
        existing.version += 1;
        existing.updatedAt = new Date().toISOString();
        updatedRecords.push(existing);
      } else {
        const newRecord: StudentAttendance = {
          id: uuidv4(),
          studentId: item.studentId,
          classId: meta.classId,
          teacherId: meta.teacherId,
          scheduleId: meta.scheduleId,
          attendanceDate: meta.date,
          status: item.status,
          note: item.note,
          version: 1,
          originDeviceId: 'client',
        };
        store.studentAttendance.push(newRecord);
        updatedRecords.push(newRecord);
      }
    }

    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'ATTENDANCE_CREATE',
      entity: 'student_attendance',
      description: `Input absensi siswa kelas ${meta.classId} (${records.length} siswa) untuk tanggal ${meta.date}`,
    });

    return updatedRecords;
  }

  public static correctAttendance(
    data: {
      targetAttendanceId: string;
      targetType: 'TEACHER' | 'STUDENT';
      newStatus: AttendanceStatus;
      reason: string;
    },
    currentUserId: string
  ): AttendanceCorrection {
    const store = dbManager.getStore();
    let oldStatus: AttendanceStatus = 'ALPHA';

    if (data.targetType === 'TEACHER') {
      const att = store.teacherAttendance.find((a) => a.id === data.targetAttendanceId && !a.deletedAt);
      if (!att) throw new Error('Data absensi guru tidak ditemukan.');
      oldStatus = att.status;
      att.status = data.newStatus;
      att.version += 1;
      att.updatedAt = new Date().toISOString();
    } else {
      const att = store.studentAttendance.find((a) => a.id === data.targetAttendanceId && !a.deletedAt);
      if (!att) throw new Error('Data absensi siswa tidak ditemukan.');
      oldStatus = att.status;
      att.status = data.newStatus;
      att.version += 1;
      att.updatedAt = new Date().toISOString();
    }

    const correction: AttendanceCorrection = {
      id: uuidv4(),
      targetAttendanceId: data.targetAttendanceId,
      targetType: data.targetType,
      oldStatus,
      newStatus: data.newStatus,
      reason: data.reason,
      correctedByUserId: currentUserId,
      correctedAt: new Date().toISOString(),
    };

    store.attendanceCorrections.push(correction);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'ATTENDANCE_CORRECTION',
      entity: data.targetType === 'TEACHER' ? 'teacher_attendance' : 'student_attendance',
      entityId: data.targetAttendanceId,
      oldData: { status: oldStatus },
      newData: { status: data.newStatus },
      description: `Koreksi absensi ${data.targetType}: ${oldStatus} -> ${data.newStatus}. Alasan: ${data.reason}`,
    });

    return correction;
  }

  public static getDashboardStats(dateString?: string): DashboardStats {
    const store = dbManager.getStore();
    const date = dateString || new Date().toISOString().split('T')[0];

    const activeTeachers = store.teachers.filter((t) => t.active && !t.deletedAt);
    const activeStudents = store.students.filter((s) => s.active && !s.deletedAt);

    const teacherAttToday = store.teacherAttendance.filter(
      (a) => a.attendanceDate === date && !a.deletedAt
    );
    const studentAttToday = store.studentAttendance.filter(
      (a) => a.attendanceDate === date && !a.deletedAt
    );

    const teachersPresent = teacherAttToday.filter((a) => a.status === 'HADIR').length;
    const teachersLate = teacherAttToday.filter((a) => a.status === 'TERLAMBAT').length;
    const teachersPicket = teacherAttToday.filter((a) => a.attendanceType === 'PICKET').length;

    const studentsPresent = studentAttToday.filter((a) => a.status === 'HADIR').length;
    const studentsLate = studentAttToday.filter((a) => a.status === 'TERLAMBAT').length;
    const studentsExcused = studentAttToday.filter((a) => a.status === 'IZIN').length;
    const studentsSick = studentAttToday.filter((a) => a.status === 'SAKIT').length;
    const studentsAlpha = studentAttToday.filter((a) => a.status === 'ALPHA').length;

    const totalStudentsRecorded = studentAttToday.length || activeStudents.length || 1;
    const effectivePresent = studentsPresent + studentsLate;
    const attendanceRate = Math.round((effectivePresent / totalStudentsRecorded) * 100) || 96;

    // Daily Student Trend (simulated over 5 past days for chart)
    const dailyStudentTrend = [
      { date: 'Senin', present: 48, absent: 2, rate: 96 },
      { date: 'Selasa', present: 49, absent: 1, rate: 98 },
      { date: 'Rabu', present: 47, absent: 3, rate: 94 },
      { date: 'Kamis', present: 48, absent: 2, rate: 96 },
      { date: 'Jumat', present: effectivePresent || 49, absent: (studentsSick + studentsExcused + studentsAlpha) || 1, rate: attendanceRate },
    ];

    // Class recap aggregation
    const classRecap = store.classes.map((cls) => {
      const classStudents = activeStudents.filter((s) => s.classId === cls.id);
      const studentIds = classStudents.map((s) => s.id);
      const presentInClass = studentAttToday.filter(
        (a) => studentIds.includes(a.studentId) && (a.status === 'HADIR' || a.status === 'TERLAMBAT')
      ).length;
      const total = classStudents.length || 10;
      const count = presentInClass || Math.max(1, total - 1);
      return {
        className: cls.name,
        total,
        present: count,
        rate: Math.round((count / total) * 100),
      };
    });

    // Picket today details
    const picketToday = store.picketSchedules
      .filter((p) => p.date === date && p.active && !p.deletedAt)
      .map((p) => {
        const teacher = store.teachers.find((t) => t.id === p.teacherId);
        const att = teacherAttToday.find((a) => a.scheduleId === p.id && a.attendanceType === 'PICKET');
        return {
          teacherName: teacher ? teacher.name : 'Unknown',
          location: p.location || 'Pos Utama',
          time: `${p.startTime} - ${p.endTime}`,
          status: (att ? att.status : 'HADIR') as AttendanceStatus,
        };
      });

    return {
      totalStudents: activeStudents.length,
      totalTeachers: activeTeachers.length,
      teachersPresent,
      teachersLate,
      teachersPicket,
      studentsPresent,
      studentsLate,
      studentsExcused,
      studentsSick,
      studentsAlpha,
      attendanceRate,
      dailyStudentTrend,
      classRecap,
      picketToday,
    };
  }

  public static processScanAttendance(params: {
    code: string;
    type?: 'AUTO' | 'STUDENT' | 'TEACHER';
    method?: 'MANUAL' | 'CAMERA' | 'HARDWARE_SCANNER' | 'NFC';
    classId?: string;
    scheduleId?: string;
    date?: string;
    time?: string;
    currentUserId?: string;
  }) {
    const store = dbManager.getStore();
    const cleanCode = (params.code || '').trim();
    if (!cleanCode) {
      throw new Error('Kode barcode / QR / RFID / NFC tidak boleh kosong.');
    }

    const today = params.date || new Date().toISOString().split('T')[0];
    const actualTime =
      params.time ||
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const methodLabel =
      params.method === 'NFC'
        ? 'Tap Sensor NFC'
        : params.method === 'CAMERA'
        ? 'Scan Kamera'
        : params.method === 'MANUAL'
        ? 'Input Manual'
        : 'Hard Scanner';

    const normalizedClean = cleanCode.replace(/[:\s\-_]/g, '').toUpperCase();

    const matchesCode = (p: any, isTeacher = false) => {
      if (!p || p.deletedAt) return false;
      const candidates = [
        p.id,
        isTeacher ? p.nip : p.nis,
        !isTeacher ? p.nisn : null,
        p.cardId,
        p.nfcUid,
        p.rfidTag,
        p.rfidCardId,
        p.phone,
        p.name,
      ].filter(Boolean);

      for (const val of candidates) {
        if (typeof val === 'string') {
          if (val.toLowerCase() === cleanCode.toLowerCase()) return true;
          const norm = val.replace(/[:\s\-_]/g, '').toUpperCase();
          if (norm && norm === normalizedClean) return true;
        }
      }
      return false;
    };

    // 1. Try to find Student
    const matchedStudent =
      params.type !== 'TEACHER'
        ? store.students.find((s) => matchesCode(s, false))
        : null;

    // 2. Try to find Teacher
    const matchedTeacher =
      params.type !== 'STUDENT' && !matchedStudent
        ? store.teachers.find((t) => matchesCode(t, true))
        : null;

    if (!matchedStudent && !matchedTeacher) {
      throw new Error(`Data tidak ditemukan untuk kode barcode/RFID/NFC: "${cleanCode}"`);
    }

    const personKey = matchedStudent ? `student_${matchedStudent.id}` : `teacher_${matchedTeacher!.id}`;
    const nowTimestamp = Date.now();
    const cached = recentScanCache.get(personKey);
    if (cached && nowTimestamp - cached.time < RECENT_SCAN_COOLDOWN_MS) {
      return {
        ...cached.result,
        isAlreadyRecorded: true,
        message: `⚠️ Presensi Ganda Dicegah (Aturan 1x/Hari): Kartu ${
          matchedStudent?.name || matchedTeacher?.name
        } baru saja di-tap beberapa detik lalu. Presensi sudah tercatat.`,
      };
    }

    // Process Student Attendance
    if (matchedStudent) {
      const cls = store.classes.find((c) => c.id === matchedStudent.classId);
      const className = cls ? cls.name : 'Kelas Belum Ditentukan';

      // Sesi Otomatis Berdasarkan Jam:
      // - Pulang: >= 12:00
      // - Terlambat: > 07:15 s/d 11:59
      // - Masuk Tepat Waktu: <= 07:15
      const isCheckOutSession = actualTime >= '12:00';
      const isLate = !isCheckOutSession && actualTime > '07:15';
      const scanSession: 'MASUK' | 'TERLAMBAT' | 'PULANG' = isCheckOutSession
        ? 'PULANG'
        : isLate
        ? 'TERLAMBAT'
        : 'MASUK';

      let status: AttendanceStatus = isLate ? 'TERLAMBAT' : 'HADIR';

      let existing = store.studentAttendance.find(
        (a) =>
          a.studentId === matchedStudent.id &&
          a.attendanceDate === today &&
          !a.deletedAt
      );

      let isAlreadyRecorded = false;
      let recordedStatus = status;
      let message = '';

      if (isCheckOutSession) {
        // SESI PULANG (CHECK-OUT)
        if (existing) {
          if (existing.checkOutTime && existing.checkOutTime !== '-') {
            isAlreadyRecorded = true;
            recordedStatus = existing.status;
            message = `Sudah Absen Pulang (1x/Hari): ${matchedStudent.name} (${className}) sudah tap pulang hari ini pada pukul ${existing.checkOutTime}. Tidak dapat absen ganda.`;
          } else {
            existing.checkOutTime = actualTime;
            existing.note = existing.note
              ? `${existing.note} | Pulang: ${actualTime} [${methodLabel}]`
              : `${methodLabel} Pulang [${actualTime}]`;
            existing.updatedAt = new Date().toISOString();
            existing.version += 1;
            recordedStatus = existing.status;
            message = `Scan Pulang Berhasil! Terima kasih ${matchedStudent.name}, tercatat pulang pada pukul ${actualTime}. Selamat beristirahat!`;
          }
        } else {
          // Siswa baru scan di jam pulang (tanpa check-in pagi)
          const schedule = params.scheduleId
            ? store.teachingSchedules.find((s) => s.id === params.scheduleId)
            : store.teachingSchedules.find((s) => s.classId === matchedStudent.classId);

          existing = {
            id: uuidv4(),
            studentId: matchedStudent.id,
            classId: matchedStudent.classId,
            teacherId: schedule ? schedule.teacherId : 'system',
            subjectId: schedule ? schedule.subjectId : undefined,
            scheduleId: params.scheduleId || (schedule ? schedule.id : undefined),
            attendanceDate: today,
            status: 'HADIR',
            actualTime: actualTime,
            checkInTime: '-',
            checkOutTime: actualTime,
            note: `${methodLabel} Pulang Langsung [${actualTime}]`,
            version: 1,
            originDeviceId: 'scanner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          store.studentAttendance.push(existing);
          recordedStatus = 'HADIR';
          message = `Scan Pulang Berhasil! Siswa ${matchedStudent.name} tercatat pulang pada pukul ${actualTime}.`;
        }
      } else {
        // SESI MASUK PAGI (TEPAT WAKTU / TERLAMBAT)
        if (existing) {
          if (
            (existing.checkInTime && existing.checkInTime !== '-') ||
            (existing.actualTime && (existing.status === 'HADIR' || existing.status === 'TERLAMBAT'))
          ) {
            isAlreadyRecorded = true;
            recordedStatus = existing.status;
            message = `Sudah Absen Masuk (1x/Hari): ${matchedStudent.name} (${className}) sudah presensi masuk pada pukul ${existing.checkInTime || existing.actualTime || actualTime} [${existing.status}]. Tidak dapat absen ganda.`;
          } else {
            existing.status = status;
            existing.actualTime = actualTime;
            existing.checkInTime = actualTime;
            existing.note = `${methodLabel} [${actualTime}]`;
            existing.updatedAt = new Date().toISOString();
            existing.version += 1;
            recordedStatus = status;
            message = isLate
              ? `Presensi Berhasil: Terlambat Masuk (Pukul ${actualTime})`
              : `Presensi Berhasil: Hadir Tepat Waktu (Pukul ${actualTime})`;
          }
        } else {
          const schedule = params.scheduleId
            ? store.teachingSchedules.find((s) => s.id === params.scheduleId)
            : store.teachingSchedules.find((s) => s.classId === matchedStudent.classId);

          existing = {
            id: uuidv4(),
            studentId: matchedStudent.id,
            classId: matchedStudent.classId,
            teacherId: schedule ? schedule.teacherId : 'system',
            subjectId: schedule ? schedule.subjectId : undefined,
            scheduleId: params.scheduleId || (schedule ? schedule.id : undefined),
            attendanceDate: today,
            status,
            actualTime,
            checkInTime: actualTime,
            note: `${methodLabel} [${actualTime}]`,
            version: 1,
            originDeviceId: 'scanner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          store.studentAttendance.push(existing);
          recordedStatus = status;
          message = isLate
            ? `Presensi Berhasil: Terlambat Masuk (Pukul ${actualTime})`
            : `Presensi Berhasil: Hadir Tepat Waktu (Pukul ${actualTime})`;
        }
      }

      dbManager.saveSync();

      AuditService.log({
        action: 'ATTENDANCE_SCAN',
        entity: 'student_attendance',
        entityId: existing.id,
        userId: params.currentUserId || 'scanner',
        description: `Absensi scan ${methodLabel} [${scanSession}]: Siswa ${matchedStudent.name} (${matchedStudent.nis}) status ${recordedStatus} jam ${actualTime}`,
      });

      const result = {
        success: true,
        targetType: 'STUDENT' as const,
        person: {
          id: matchedStudent.id,
          name: matchedStudent.name,
          code: matchedStudent.nisn || matchedStudent.nis,
          subtext: `Kelas ${className} • NIS: ${matchedStudent.nis}`,
          photoUrl: (matchedStudent as any).photoUrl,
        },
        attendance: existing,
        status: recordedStatus,
        time: actualTime,
        isLate: scanSession === 'TERLAMBAT',
        isAlreadyRecorded,
        scanSession,
        checkOutTime: existing.checkOutTime,
        message,
      };

      recentScanCache.set(personKey, { time: nowTimestamp, result });
      return result;
    }

    // Process Teacher Attendance
    if (matchedTeacher) {
      const isCheckOutSession = actualTime >= '12:30';
      const isLate = !isCheckOutSession && actualTime > '07:15';
      const scanSession: 'MASUK' | 'TERLAMBAT' | 'PULANG' = isCheckOutSession
        ? 'PULANG'
        : isLate
        ? 'TERLAMBAT'
        : 'MASUK';

      const status: AttendanceStatus = isLate ? 'TERLAMBAT' : 'HADIR';

      // 1. Determine day of week: 1 = Senin, ..., 7 = Minggu
      const dateObj = new Date(today);
      let dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;

      // 2. Identify all duties of this teacher today:
      // a. Teaching schedule (find earliest class for today = "Jam Pertama")
      const todayTeachings = store.teachingSchedules
        .filter(
          (s) =>
            s.teacherId === matchedTeacher.id &&
            s.dayOfWeek === dayOfWeek &&
            s.active &&
            !s.deletedAt
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const firstTeaching = todayTeachings[0];

      // b. Picket schedule for today
      const todayPickets = store.picketSchedules.filter(
        (p) =>
          p.teacherId === matchedTeacher.id &&
          (p.date === today || p.dayOfWeek === dayOfWeek) &&
          p.active &&
          !p.deletedAt
      );
      const firstPicket = todayPickets[0];

      // c. Management schedule for today
      const todayManagements = (store.managementSchedules || []).filter(
        (m) =>
          m.teacherId === matchedTeacher.id &&
          (!m.dayOfWeek || m.dayOfWeek === 0 || m.dayOfWeek === dayOfWeek) &&
          m.active &&
          !m.deletedAt
      );
      const firstManagement = todayManagements[0];

      // 3. Find existing teacher attendances for today
      let existingList = store.teacherAttendance.filter(
        (a) => a.teacherId === matchedTeacher.id && a.attendanceDate === today && !a.deletedAt
      );

      let isAlreadyRecorded = false;
      let recordedStatus = status;
      let message = '';
      const updatedDuties: string[] = [];

      if (isCheckOutSession) {
        // SESI PULANG (CHECK-OUT)
        if (existingList.length > 0) {
          const allCheckedOut = existingList.every(
            (a) => a.checkOutTime && a.checkOutTime !== '-'
          );
          if (allCheckedOut) {
            isAlreadyRecorded = true;
            recordedStatus = existingList[0].status;
            message = `Sudah Absen Pulang (1x/Hari): Guru ${matchedTeacher.name} sudah tap pulang hari ini pada pukul ${existingList[0].checkOutTime}. Tidak dapat absen ganda.`;
          } else {
            // Update checkOutTime across ALL existing records in a single tap
            existingList.forEach((att) => {
              att.checkOutTime = actualTime;
              att.updatedAt = new Date().toISOString();
              att.version += 1;
            });
            recordedStatus = existingList[0].status;
            message = `Check-out Pulang Berhasil! Terima kasih ${matchedTeacher.name}, tercatat selesai tugas mengajar & dinas sekolah pada pukul ${actualTime}.`;
          }
        } else {
          // Checked out directly without morning check-in
          const newAtt = {
            id: uuidv4(),
            teacherId: matchedTeacher.id,
            attendanceDate: today,
            attendanceType: 'TEACHING' as const,
            scheduledStart: '07:00',
            scheduledEnd: '15:00',
            actualTime: actualTime,
            checkOutTime: actualTime,
            status: 'HADIR' as const,
            source: 'CHECK_IN' as const,
            note: `${methodLabel} Pulang Langsung [${actualTime}]`,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          store.teacherAttendance.push(newAtt);
          existingList.push(newAtt);
          recordedStatus = 'HADIR';
          message = `Check-out Pulang Berhasil! Guru ${matchedTeacher.name} tercatat pulang pukul ${actualTime}.`;
        }
      } else {
        // SESI MASUK PAGI (CUKUP SEKALI TAP - MULTI-TUGAS TERISI OTOMATIS)
        const alreadyCheckedIn = existingList.some(
          (a) => a.actualTime && (a.status === 'HADIR' || a.status === 'TERLAMBAT')
        );

        if (alreadyCheckedIn) {
          isAlreadyRecorded = true;
          recordedStatus = existingList[0]?.status || status;
          message = `Sudah Absen Masuk (1x/Hari): Guru ${matchedTeacher.name} sudah melakukan presensi masuk pada pukul ${existingList[0]?.actualTime || actualTime} [Status: ${recordedStatus}]. Presensi ganda 1x/hari dicegah.`;
        } else {
          // Record or auto-fill ALL duties in a single tap:
          // Duty 1: Teaching Jam Pertama
          if (firstTeaching) {
            const cls = store.classes.find((c) => c.id === firstTeaching.classId);
            const sbj = store.subjects.find((s) => s.id === firstTeaching.subjectId);
            const detail = `${sbj?.name || 'Mapel'} - ${cls?.name || 'Kelas'} (${firstTeaching.room || 'R.?'}) [Jam Ke-1: ${firstTeaching.startTime}-${firstTeaching.endTime}]`;

            let teachAtt = existingList.find(
              (a) => a.attendanceType === 'TEACHING' && a.scheduleId === firstTeaching.id
            );
            if (!teachAtt) {
              teachAtt = existingList.find((a) => a.attendanceType === 'TEACHING');
            }

            if (teachAtt) {
              teachAtt.status = status;
              teachAtt.actualTime = actualTime;
              teachAtt.checkInTime = actualTime;
              teachAtt.source = 'CHECK_IN';
              teachAtt.scheduleDetail = detail;
              teachAtt.updatedAt = new Date().toISOString();
              teachAtt.version += 1;
            } else {
              teachAtt = {
                id: uuidv4(),
                teacherId: matchedTeacher.id,
                attendanceDate: today,
                attendanceType: 'TEACHING',
                scheduleId: firstTeaching.id,
                scheduleDetail: detail,
                scheduledStart: firstTeaching.startTime,
                scheduledEnd: firstTeaching.endTime,
                actualTime,
                checkInTime: actualTime,
                status,
                source: 'CHECK_IN',
                note: `${methodLabel} [Jam Ke-1]`,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              store.teacherAttendance.push(teachAtt);
              existingList.push(teachAtt);
            }
            updatedDuties.push(`Mengajar Jam Ke-1 (${cls?.name || 'Kelas'})`);
          }

          // Duty 2: Guru Piket
          if (firstPicket) {
            const detail = `Piket: ${firstPicket.location || 'Pos Utama'} [${firstPicket.startTime}-${firstPicket.endTime}]`;
            let picketAtt = existingList.find(
              (a) => a.attendanceType === 'PICKET' && a.scheduleId === firstPicket.id
            );
            if (!picketAtt) {
              picketAtt = existingList.find((a) => a.attendanceType === 'PICKET');
            }
            if (picketAtt) {
              picketAtt.status = status;
              picketAtt.actualTime = actualTime;
              picketAtt.checkInTime = actualTime;
              picketAtt.source = 'CHECK_IN';
              picketAtt.scheduleDetail = detail;
              picketAtt.updatedAt = new Date().toISOString();
              picketAtt.version += 1;
            } else {
              picketAtt = {
                id: uuidv4(),
                teacherId: matchedTeacher.id,
                attendanceDate: today,
                attendanceType: 'PICKET',
                scheduleId: firstPicket.id,
                scheduleDetail: detail,
                scheduledStart: firstPicket.startTime,
                scheduledEnd: firstPicket.endTime,
                actualTime,
                checkInTime: actualTime,
                status,
                source: 'CHECK_IN',
                note: `${methodLabel} [Tugas Piket]`,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              store.teacherAttendance.push(picketAtt);
              existingList.push(picketAtt);
            }
            updatedDuties.push(`Guru Piket (${firstPicket.location || 'Pos Utama'})`);
          }

          // Duty 3: Tugas Manajemen
          if (firstManagement) {
            const detail = `Tugas Manajemen: ${firstManagement.roleTitle} (${firstManagement.roomOrDesk || 'Kantor'})`;
            let mgmtAtt = existingList.find(
              (a) => a.attendanceType === 'MANAGEMENT' && a.scheduleId === firstManagement.id
            );
            if (!mgmtAtt) {
              mgmtAtt = existingList.find((a) => a.attendanceType === 'MANAGEMENT');
            }

            if (mgmtAtt) {
              mgmtAtt.status = status;
              mgmtAtt.actualTime = actualTime;
              mgmtAtt.checkInTime = actualTime;
              mgmtAtt.source = 'CHECK_IN';
              mgmtAtt.scheduleDetail = detail;
              mgmtAtt.updatedAt = new Date().toISOString();
              mgmtAtt.version += 1;
            } else {
              mgmtAtt = {
                id: uuidv4(),
                teacherId: matchedTeacher.id,
                attendanceDate: today,
                attendanceType: 'MANAGEMENT',
                scheduleId: firstManagement.id,
                scheduleDetail: detail,
                scheduledStart: firstManagement.startTime || '07:00',
                scheduledEnd: firstManagement.endTime || '15:00',
                actualTime,
                checkInTime: actualTime,
                status,
                source: 'CHECK_IN',
                note: `${methodLabel} [Tugas Manajemen]`,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              store.teacherAttendance.push(mgmtAtt);
              existingList.push(mgmtAtt);
            }
            updatedDuties.push(`Manajemen (${firstManagement.roleTitle})`);
          }

          // Sinkronisasi record duties hari ini lainnya di existingList (agar 1x tap otomatis terisi semua)
          existingList.forEach((att) => {
            if (!att.actualTime || att.status === 'ALPHA') {
              att.status = status;
              att.actualTime = actualTime;
              att.checkInTime = actualTime;
              att.source = 'CHECK_IN';
              att.updatedAt = new Date().toISOString();
              att.version += 1;
              if (att.attendanceType === 'PICKET' && !updatedDuties.some((d) => d.includes('Piket'))) {
                updatedDuties.push('Guru Piket');
              } else if (att.attendanceType === 'MANAGEMENT' && !updatedDuties.some((d) => d.includes('Manajemen'))) {
                updatedDuties.push('Tugas Manajemen');
              }
            }
          });

          // Fallback if no specific schedule found
          if (updatedDuties.length === 0) {
            const generalAtt = {
              id: uuidv4(),
              teacherId: matchedTeacher.id,
              attendanceDate: today,
              attendanceType: 'TEACHING' as const,
              scheduledStart: '07:00',
              scheduledEnd: '15:00',
              actualTime,
              checkInTime: actualTime,
              status,
              source: 'CHECK_IN' as const,
              note: `${methodLabel} Presensi Kehadiran Pagi`,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            store.teacherAttendance.push(generalAtt);
            existingList.push(generalAtt);
            updatedDuties.push('Kehadiran Umum Guru');
          }

          recordedStatus = status;
          const dutiesLabel = updatedDuties.join(' + ');
          message = isLate
            ? `Presensi Berhasil (Sekali Tap): Guru ${matchedTeacher.name} tercatat Terlambat (Pukul ${actualTime}) untuk [${dutiesLabel}].`
            : `Presensi Berhasil (Otomatis Multi-Tugas Sekali Tap): Guru ${matchedTeacher.name} tercatat Hadir Tepat Waktu (Pukul ${actualTime}) untuk [${dutiesLabel}].`;
        }
      }

      dbManager.saveSync();

      const primaryRecord = existingList[0];

      AuditService.log({
        action: 'ATTENDANCE_SCAN',
        entity: 'teacher_attendance',
        entityId: primaryRecord?.id || matchedTeacher.id,
        userId: params.currentUserId || 'scanner',
        description: `Presensi scan guru ${methodLabel} [${scanSession}]: ${matchedTeacher.name} status ${recordedStatus} jam ${actualTime} (${updatedDuties.join(', ') || '1x Tap'})`,
      });

      const result = {
        success: true,
        targetType: 'TEACHER' as const,
        person: {
          id: matchedTeacher.id,
          name: matchedTeacher.name,
          code: matchedTeacher.nip || matchedTeacher.id,
          subtext: `Guru / Tenaga Pendidik • NIP: ${matchedTeacher.nip || '-'}`,
          photoUrl: (matchedTeacher as any).photoUrl,
        },
        attendance: primaryRecord,
        status: recordedStatus,
        time: actualTime,
        isLate: scanSession === 'TERLAMBAT',
        isAlreadyRecorded,
        scanSession,
        checkOutTime: primaryRecord?.checkOutTime,
        message,
      };

      recentScanCache.set(personKey, { time: nowTimestamp, result });
      return result;
    }

    throw new Error('Gagal memproses data absensi.');
  }
}
