import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { DhuhaAttendance, DhuhaStatus } from '../../src/types/index.js';

export class DhuhaService {
  public static getAll(params: {
    date?: string;
    targetType?: 'STUDENT' | 'TEACHER';
    classId?: string;
    search?: string;
  }) {
    const store = dbManager.getStore();
    if (!store.dhuhaAttendance) {
      store.dhuhaAttendance = [];
    }

    const targetDate = params.date || new Date().toISOString().split('T')[0];
    const type = params.targetType || 'STUDENT';

    let resultList: any[] = [];

    if (type === 'STUDENT') {
      let students = store.students.filter((s) => !s.deletedAt && s.active);
      if (params.classId) {
        students = students.filter((s) => s.classId === params.classId);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        students = students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.nis.includes(q) ||
            (s.nisn && s.nisn.includes(q))
        );
      }

      resultList = students.map((s) => {
        const cls = store.classes.find((c) => c.id === s.classId);
        const className = cls ? cls.name : 'Kelas -';
        const record = store.dhuhaAttendance!.find(
          (d) => d.personId === s.id && d.date === targetDate && d.targetType === 'STUDENT'
        );

        return {
          personId: s.id,
          targetType: 'STUDENT' as const,
          name: s.name,
          identifier: s.nis,
          nisn: s.nisn,
          classOrSubject: className,
          classId: s.classId,
          gender: s.gender || 'L',
          date: targetDate,
          attendanceId: record ? record.id : undefined,
          status: (record ? record.status : 'TIDAK_HADIR') as DhuhaStatus,
          time: record ? record.time : '-',
          note: record ? record.note : '-',
        };
      });
    } else {
      let teachers = store.teachers.filter((t) => !t.deletedAt && t.active);
      if (params.search) {
        const q = params.search.toLowerCase();
        teachers = teachers.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.nip && t.nip.includes(q))
        );
      }

      resultList = teachers.map((t) => {
        const record = store.dhuhaAttendance!.find(
          (d) => d.personId === t.id && d.date === targetDate && d.targetType === 'TEACHER'
        );

        return {
          personId: t.id,
          targetType: 'TEACHER' as const,
          name: t.name,
          identifier: t.nip || '-',
          classOrSubject: (t as any).subject || 'Dewan Guru',
          gender: t.gender || 'L',
          date: targetDate,
          attendanceId: record ? record.id : undefined,
          status: (record ? record.status : 'TIDAK_HADIR') as DhuhaStatus,
          time: record ? record.time : '-',
          note: record ? record.note : '-',
        };
      });
    }

    // Calculate Summary Stats
    const totalPersons = resultList.length;
    const totalHadir = resultList.filter((r) => r.status === 'HADIR').length;
    const totalBerhalangan = resultList.filter((r) => r.status === 'BERHALANGAN').length;
    const totalBelum = totalPersons - totalHadir - totalBerhalangan;
    const participationRate = totalPersons > 0 ? Math.round((totalHadir / totalPersons) * 100) : 0;

    return {
      date: targetDate,
      targetType: type,
      items: resultList,
      stats: {
        total: totalPersons,
        hadir: totalHadir,
        berhalangan: totalBerhalangan,
        belum: totalBelum,
        rate: participationRate,
      },
    };
  }

  public static processScan(params: {
    code: string;
    method?: 'CAMERA' | 'HARDWARE_SCANNER';
    date?: string;
    time?: string;
    currentUserId?: string;
  }) {
    const store = dbManager.getStore();
    if (!store.dhuhaAttendance) {
      store.dhuhaAttendance = [];
    }

    const cleanCode = (params.code || '').trim();
    if (!cleanCode) {
      throw new Error('Kode kartu barcode/QR/RFID/NFC tidak boleh kosong.');
    }

    const today = params.date || new Date().toISOString().split('T')[0];
    const actualTime =
      params.time ||
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const methodLabel =
      (params as any).method === 'NFC'
        ? 'Tap Sensor NFC'
        : params.method === 'CAMERA'
        ? 'Scan Kamera'
        : (params as any).method === 'MANUAL'
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

    // 1. Match Student
    const matchedStudent = store.students.find((s) => matchesCode(s, false));

    // 2. Match Teacher if not student
    const matchedTeacher = !matchedStudent
      ? store.teachers.find((t) => matchesCode(t, true))
      : null;

    if (!matchedStudent && !matchedTeacher) {
      throw new Error(`Data tidak ditemukan untuk kode barcode/RFID/NFC: "${cleanCode}"`);
    }

    const targetType: 'STUDENT' | 'TEACHER' = matchedStudent ? 'STUDENT' : 'TEACHER';
    const personId = matchedStudent ? matchedStudent.id : matchedTeacher!.id;
    const personName = matchedStudent ? matchedStudent.name : matchedTeacher!.name;
    const identifier = matchedStudent ? matchedStudent.nis : (matchedTeacher!.nip || '-');
    const gender = matchedStudent ? matchedStudent.gender : matchedTeacher!.gender;

    let classOrSubject = 'Umum';
    if (matchedStudent) {
      const cls = store.classes.find((c) => c.id === matchedStudent.classId);
      classOrSubject = cls ? `Kelas ${cls.name}` : 'Siswa';
    } else if (matchedTeacher) {
      classOrSubject = (matchedTeacher as any).subject || 'Tenaga Pendidik';
    }

    let existing = store.dhuhaAttendance.find(
      (d) => d.personId === personId && d.date === today && d.targetType === targetType
    );

    let isAlreadyRecorded = false;
    let message = '';

    if (existing) {
      if (existing.status === 'HADIR') {
        isAlreadyRecorded = true;
        message = `⚠️ Sudah Presensi Sholat Dhuha (Aturan 1x/Hari): ${personName} (${classOrSubject}) sudah tercatat sholat dhuha hari ini pada pukul ${existing.time}. Presensi ganda ditolak.`;
      } else if (existing.status === 'HALANGAN_SYARI') {
        isAlreadyRecorded = true;
        message = `ℹ️ Status Halangan Syar'i (1x/Hari): ${personName} (${classOrSubject}) berstatus Berhalangan Syar'i (Haid). Tidak dapat presensi sholat.`;
      } else {
        existing.status = 'HADIR';
        existing.time = actualTime;
        existing.note = `${methodLabel} [${actualTime}]`;
        existing.updatedAt = new Date().toISOString();
        existing.version += 1;
        message = `Alhamdulillah! Presensi Sholat Dhuha Berhasil: ${personName} (${classOrSubject}) tercatat hadir pukul ${actualTime}.`;
      }
    } else {
      existing = {
        id: uuidv4(),
        targetType,
        personId,
        name: personName,
        identifier,
        classOrSubject,
        gender,
        date: today,
        time: actualTime,
        status: 'HADIR',
        note: `${methodLabel} [${actualTime}]`,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.dhuhaAttendance.push(existing);
      message = `Alhamdulillah! Presensi Sholat Dhuha Berhasil: ${personName} (${classOrSubject}) tercatat hadir pukul ${actualTime}.`;
    }

    dbManager.saveSync();

    AuditService.log({
      action: 'DHUHA_ATTENDANCE_SCAN',
      entity: 'dhuha_attendance',
      entityId: existing.id,
      userId: params.currentUserId || 'scanner',
      description: `Presensi Sholat Dhuha ${methodLabel}: ${personName} (${classOrSubject}) status ${existing.status} jam ${actualTime}`,
    });

    return {
      success: true,
      targetType,
      person: {
        id: personId,
        name: personName,
        identifier,
        classOrSubject,
        gender,
      },
      record: existing,
      isAlreadyRecorded,
      message,
    };
  }

  public static updateStatus(data: {
    personId: string;
    targetType: 'STUDENT' | 'TEACHER';
    date: string;
    status: DhuhaStatus;
    note?: string;
  }, currentUserId?: string) {
    const store = dbManager.getStore();
    if (!store.dhuhaAttendance) {
      store.dhuhaAttendance = [];
    }

    let personName = '';
    let identifier = '';
    let classOrSubject = '';
    let gender: 'L' | 'P' = 'L';

    if (data.targetType === 'STUDENT') {
      const s = store.students.find((stu) => stu.id === data.personId);
      if (!s) throw new Error('Data siswa tidak ditemukan.');
      personName = s.name;
      identifier = s.nis;
      gender = s.gender || 'L';
      const cls = store.classes.find((c) => c.id === s.classId);
      classOrSubject = cls ? `Kelas ${cls.name}` : '-';
    } else {
      const t = store.teachers.find((tch) => tch.id === data.personId);
      if (!t) throw new Error('Data guru tidak ditemukan.');
      personName = t.name;
      identifier = t.nip || '-';
      gender = t.gender || 'L';
      classOrSubject = (t as any).subject || 'Guru';
    }

    const currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let existing = store.dhuhaAttendance.find(
      (d) => d.personId === data.personId && d.date === data.date && d.targetType === data.targetType
    );

    if (existing) {
      existing.status = data.status;
      if (data.status === 'HADIR' && (!existing.time || existing.time === '-')) {
        existing.time = currentTime;
      }
      if (data.note !== undefined) {
        existing.note = data.note;
      }
      existing.updatedAt = new Date().toISOString();
      existing.version += 1;
    } else {
      existing = {
        id: uuidv4(),
        targetType: data.targetType,
        personId: data.personId,
        name: personName,
        identifier,
        classOrSubject,
        gender,
        date: data.date,
        time: data.status === 'HADIR' ? currentTime : '-',
        status: data.status,
        note: data.note || (data.status === 'BERHALANGAN' ? "Halangan Syar'i (Haid)" : 'Input Manual'),
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.dhuhaAttendance.push(existing);
    }

    dbManager.saveSync();

    AuditService.log({
      action: 'DHUHA_STATUS_UPDATE',
      entity: 'dhuha_attendance',
      entityId: existing.id,
      userId: currentUserId || 'admin',
      description: `Update status Sholat Dhuha ${personName} -> ${data.status} (${existing.note})`,
    });

    return existing;
  }
}
