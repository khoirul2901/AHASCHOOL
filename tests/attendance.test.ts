import assert from 'assert';
import { dbManager } from '../server/db/database.js';
import { AuthService } from '../server/services/authService.js';
import { TeacherService } from '../server/services/teacherService.js';
import { StudentService } from '../server/services/studentService.js';
import { ClassService } from '../server/services/classService.js';
import { ScheduleService } from '../server/services/scheduleService.js';
import { AttendanceEngine } from '../server/services/attendanceEngine.js';
import { AttendanceService } from '../server/services/attendanceService.js';
import { SyncService } from '../server/services/syncService.js';

async function runTests() {
  console.log('=== MEMULAI TEST SIAKAD SEKOLAH TERPADU ===\n');

  // 1. Initialize Database
  await dbManager.init();
  await dbManager.resetToSeed();
  const store = dbManager.getStore();
  console.log('✓ Database initialized & reset to clean seed state');

  // 2. Authentication Test
  console.log('\n[TEST 1] Authentication & RBAC');
  const adminLogin = await AuthService.login('admin', 'admin123');
  assert(adminLogin !== null, 'Admin login should succeed');
  assert(adminLogin.roles.includes('SUPER_ADMIN'), 'Admin should have SUPER_ADMIN role');
  assert(AuthService.hasPermission(adminLogin, 'student.create'), 'Admin should have student.create permission');
  console.log('✓ Admin login & superadmin permissions valid');

  const budiLogin = await AuthService.login('budi', 'guru123');
  assert(budiLogin !== null, 'Guru Budi login should succeed');
  assert(budiLogin.roles.includes('GURU'), 'Budi should have GURU role');
  assert(budiLogin.roles.includes('GURU_PIKET'), 'Budi should have GURU_PIKET role');
  assert(budiLogin.roles.includes('WALI_KELAS'), 'Budi should have WALI_KELAS role');
  console.log('✓ Multi-role verification: Budi has GURU, GURU_PIKET, and WALI_KELAS');

  // 3. Schedule Conflict Validation Test
  console.log('\n[TEST 2] Schedule Conflict Validation');
  // Attempt to schedule Budi at same time (Monday 07:45 - 08:30 overlaps with 07:30 - 08:15)
  let teacherConflictCaught = false;
  try {
    ScheduleService.createTeachingSchedule({
      teacherId: 'tch-budi-01',
      classId: 'cls-9a',
      subjectId: 'sbj-mtk',
      dayOfWeek: 1, // Senin
      startTime: '07:45',
      endTime: '08:30',
      room: 'R. 999',
    });
  } catch (err: any) {
    teacherConflictCaught = true;
    assert(err.message.includes('bentrok'), 'Error message must clearly state conflict');
  }
  assert(teacherConflictCaught, 'Schedule conflict for teacher should be prevented');
  console.log('✓ Teacher schedule conflict successfully detected and blocked');

  // 4. Room Conflict Validation Test
  let roomConflictCaught = false;
  try {
    ScheduleService.createTeachingSchedule({
      teacherId: 'tch-ratna-06', // Ratna is free at this time
      classId: 'cls-8b',        // 8B is free at 07:45 - 08:10 (their MTK class starts at 08:15)
      subjectId: 'sbj-big',
      dayOfWeek: 1, // Senin
      startTime: '07:45',
      endTime: '08:10',
      room: 'R. 201', // R. 201 already in use by Budi (07:30 - 08:15)
    });
  } catch (err: any) {
    roomConflictCaught = true;
    assert(err.message.includes('Ruangan'), 'Error message must state room conflict: ' + err.message);
  }
  assert(roomConflictCaught, 'Room schedule conflict should be prevented');
  console.log('✓ Room schedule conflict successfully detected and blocked');

  // 5. CRITICAL TEST: Guru Budi Picket + Teaching on Same Day
  console.log('\n[TEST 3 - WAJIB] Guru Budi Piket (07:00-14:00) & Mengajar (07:30-08:15)');
  // We use a Monday test date: 2026-09-28 (a Monday)
  const testDate = '2026-09-28';

  // Ensure picket schedule exists for Budi on testDate
  store.picketSchedules.push({
    id: 'pkt-budi-test',
    teacherId: 'tch-budi-01',
    date: testDate,
    startTime: '07:00',
    endTime: '14:00',
    location: 'Pos Lobby Utama',
    active: true,
    version: 1,
  });

  // Generate daily attendance for testDate
  AttendanceEngine.generateDailyAttendance(testDate);

  // Check records for Budi on testDate
  const budiRecords = store.teacherAttendance.filter(
    (att) => att.teacherId === 'tch-budi-01' && att.attendanceDate === testDate && !att.deletedAt
  );

  const picketRecords = budiRecords.filter((r) => r.attendanceType === 'PICKET');
  const teachingRecords = budiRecords.filter((r) => r.attendanceType === 'TEACHING');

  assert.strictEqual(picketRecords.length, 1, 'Guru Budi MUST have exactly 1 PICKET record');
  assert.strictEqual(teachingRecords.length, 2, 'Guru Budi has 2 teaching schedules on Senin (8A & 8B)');
  assert.strictEqual(
    picketRecords[0].scheduledStart,
    '07:00',
    'Picket scheduled start should be 07:00'
  );
  console.log('✓ Guru Budi attendance generated: distinct PICKET and TEACHING records created');

  // 6. Idempotency & Repeat Sync Test (MUST NOT create duplicate records)
  console.log('\n[TEST 4 - WAJIB] Duplicate Prevention & Sync Idempotency (Sync 2x)');
  // Run generate again for same date
  AttendanceEngine.generateDailyAttendance(testDate);

  const budiRecordsAfterSecondRun = store.teacherAttendance.filter(
    (att) => att.teacherId === 'tch-budi-01' && att.attendanceDate === testDate && !att.deletedAt
  );

  assert.strictEqual(
    budiRecordsAfterSecondRun.filter((r) => r.attendanceType === 'PICKET').length,
    1,
    'Running generate again must NOT duplicate PICKET record'
  );
  assert.strictEqual(
    budiRecordsAfterSecondRun.filter((r) => r.attendanceType === 'TEACHING').length,
    2,
    'Running generate again must NOT duplicate TEACHING records'
  );
  console.log('✓ Generating attendance repeatedly is idempotent, no duplicates created');

  // Push sync twice for same record
  const syncPayload = [
    {
      id: 'sync-item-1',
      operation: 'INSERT' as const,
      entity: 'teacher_attendance',
      entityId: picketRecords[0].id,
      payload: {
        ...picketRecords[0],
        status: 'HADIR',
      },
      version: 1,
    },
  ];

  SyncService.push('device-test-01', syncPayload);
  SyncService.push('device-test-01', syncPayload);

  const budiPicketAfterSync2x = store.teacherAttendance.filter(
    (att) =>
      att.teacherId === 'tch-budi-01' &&
      att.attendanceDate === testDate &&
      att.attendanceType === 'PICKET' &&
      !att.deletedAt
  );
  assert.strictEqual(
    budiPicketAfterSync2x.length,
    1,
    'Syncing twice MUST still produce exactly 1 PICKET record'
  );
  console.log('✓ Bidirectional sync pushed 2x remains strictly 1 record (Idempotent)');

  // 7. Student Attendance & Batch Submission Test
  console.log('\n[TEST 5] Student Attendance Batch Operation');
  const classStudents = StudentService.getAll({ classId: 'cls-8a', limit: 20 });
  assert.strictEqual(classStudents.items.length, 10, 'Class 8A should have 10 students');

  const studentAttRecords = AttendanceService.getStudentAttendances({
    date: testDate,
    classId: 'cls-8a',
    scheduleId: 'sch-budi-8a-senin',
  });
  assert.strictEqual(studentAttRecords.length, 10, 'Should load attendance for all 10 students in class');

  // Submit batch updates (Mark student 1 as SAKIT, student 2 as IZIN, others HADIR)
  const batchSubmit = studentAttRecords.map((s, idx) => ({
    studentId: s.studentId,
    status: (idx === 0 ? 'SAKIT' : idx === 1 ? 'IZIN' : 'HADIR') as any,
    note: idx === 0 ? 'Surat dokter' : undefined,
  }));

  AttendanceService.saveStudentAttendances(batchSubmit, {
    classId: 'cls-8a',
    date: testDate,
    scheduleId: 'sch-budi-8a-senin',
    teacherId: 'tch-budi-01',
  });

  const updatedStudentAtt = AttendanceService.getStudentAttendances({
    date: testDate,
    classId: 'cls-8a',
    scheduleId: 'sch-budi-8a-senin',
  });
  assert.strictEqual(updatedStudentAtt[0].status, 'SAKIT', 'Student 1 should be SAKIT');
  assert.strictEqual(updatedStudentAtt[1].status, 'IZIN', 'Student 2 should be IZIN');
  console.log('✓ Student attendance batch operation verified');

  // 8. Attendance Correction with Audit Trail
  console.log('\n[TEST 6] Attendance Correction & Audit Log');
  const targetStudentAtt = updatedStudentAtt[0];
  const correction = AttendanceService.correctAttendance(
    {
      targetAttendanceId: targetStudentAtt.id,
      targetType: 'STUDENT',
      newStatus: 'HADIR',
      reason: 'Siswa salah input, ternyata hadir di kelas',
    },
    'usr-admin-01'
  );

  assert.strictEqual(correction.oldStatus, 'SAKIT', 'Old status should be preserved as SAKIT');
  assert.strictEqual(correction.newStatus, 'HADIR', 'New status should be HADIR');

  const auditLogs = store.auditLogs.filter((l) => l.action === 'ATTENDANCE_CORRECTION');
  assert(auditLogs.length > 0, 'Audit log must record attendance correction with reason and user');
  console.log('✓ Attendance correction preserved history and recorded audit trail');

  // 9. Dashboard Statistics Aggregation
  console.log('\n[TEST 7] Dashboard Aggregation');
  const stats = AttendanceService.getDashboardStats(testDate);
  assert(stats.totalStudents >= 50, 'Total students should be at least 50');
  assert(stats.totalTeachers >= 10, 'Total teachers should be at least 10');
  assert(stats.dailyStudentTrend.length > 0, 'Student trend should have data');
  assert(stats.classRecap.length === 5, 'Class recap should summarize 5 classes');
  console.log('✓ Dashboard aggregations calculated correctly');

  console.log('\n=============================================');
  console.log('✓ SEMUA TEST BERHASIL LULUS 100%!');
  console.log('=============================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST GAGAL:', err);
  process.exit(1);
});
