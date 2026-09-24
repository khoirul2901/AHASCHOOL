import { dbManager } from '../db/database.js';

export class ReportService {
  public static getStudentReport(params: {
    startDate?: string;
    endDate?: string;
    classId?: string;
    status?: string;
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

    return records.map((a) => {
      const student = store.students.find((s) => s.id === a.studentId);
      const cls = store.classes.find((c) => c.id === a.classId);
      return {
        id: a.id,
        date: a.attendanceDate,
        studentNis: student ? student.nis : '-',
        studentName: student ? student.name : 'Unknown',
        className: cls ? cls.name : '-',
        status: a.status,
        note: a.note || '-',
      };
    });
  }

  public static getTeacherReport(params: {
    startDate?: string;
    endDate?: string;
    teacherId?: string;
    type?: string;
    status?: string;
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

    return records.map((a) => {
      const teacher = store.teachers.find((t) => t.id === a.teacherId);
      return {
        id: a.id,
        date: a.attendanceDate,
        teacherNip: teacher?.nip || '-',
        teacherName: teacher ? teacher.name : 'Unknown',
        type: a.attendanceType === 'TEACHING' ? 'Mengajar' : 'Piket',
        scheduled: `${a.scheduledStart} - ${a.scheduledEnd}`,
        actualTime: a.actualTime || '-',
        status: a.status,
        source: a.source,
        note: a.note || '-',
      };
    });
  }

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
