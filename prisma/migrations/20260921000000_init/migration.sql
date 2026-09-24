-- CreateTable
CREATE TABLE `schools` (
    `id` VARCHAR(191) NOT NULL,
    `npsn` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `principal` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `schools_npsn_key`(`npsn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_settings` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `teacherAttendanceMode` VARCHAR(191) NOT NULL DEFAULT 'AUTO_HADIR',
    `lateToleranceMinutes` INTEGER NOT NULL DEFAULT 10,
    `autoSyncIntervalSec` INTEGER NOT NULL DEFAULT 30,
    `allowOfflineAttendance` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_settings_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_years` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `academic_years_schoolId_name_key`(`schoolId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semesters` (
    `id` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `semesterNumber` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `semesters_academicYearId_semesterNumber_key`(`academicYearId`, `semesterNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `nip` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `teachers_userId_key`(`userId`),
    UNIQUE INDEX `teachers_nip_key`(`nip`),
    INDEX `teachers_nip_idx`(`nip`),
    INDEX `teachers_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `nis` VARCHAR(191) NOT NULL,
    `nisn` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NULL,
    `classId` VARCHAR(191) NOT NULL,
    `parentName` VARCHAR(191) NULL,
    `parentPhone` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `students_nis_key`(`nis`),
    UNIQUE INDEX `students_nisn_key`(`nisn`),
    INDEX `students_nis_idx`(`nis`),
    INDEX `students_nisn_idx`(`nisn`),
    INDEX `students_classId_idx`(`classId`),
    INDEX `students_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `grade` INTEGER NOT NULL,
    `major` VARCHAR(191) NULL,
    `homeroomTeacherId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `classes_name_academicYearId_key`(`name`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `subjects_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teaching_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `room` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `teaching_schedules_dayOfWeek_teacherId_idx`(`dayOfWeek`, `teacherId`),
    INDEX `teaching_schedules_dayOfWeek_classId_idx`(`dayOfWeek`, `classId`),
    INDEX `teaching_schedules_dayOfWeek_room_idx`(`dayOfWeek`, `room`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `picket_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `picket_schedules_date_teacherId_idx`(`date`, `teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isNational` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `holidays_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_substitutions` (
    `id` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NOT NULL,
    `originalTeacherId` VARCHAR(191) NOT NULL,
    `replacementTeacherId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_substitutions_scheduleId_date_key`(`scheduleId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `attendanceType` ENUM('TEACHING', 'PICKET') NOT NULL,
    `scheduleId` VARCHAR(191) NULL,
    `attendanceDate` VARCHAR(191) NOT NULL,
    `scheduledStart` VARCHAR(191) NOT NULL,
    `scheduledEnd` VARCHAR(191) NOT NULL,
    `actualTime` VARCHAR(191) NULL,
    `status` ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA', 'DINAS', 'LIBUR', 'DIBATALKAN') NOT NULL DEFAULT 'HADIR',
    `source` ENUM('SYSTEM', 'CHECK_IN', 'MANUAL', 'OFFLINE') NOT NULL DEFAULT 'SYSTEM',
    `note` VARCHAR(191) NULL,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `teacher_attendance_attendanceDate_teacherId_idx`(`attendanceDate`, `teacherId`),
    INDEX `teacher_attendance_attendanceDate_status_idx`(`attendanceDate`, `status`),
    UNIQUE INDEX `teacher_attendance_teacherId_attendanceDate_attendanceType_scheduleId_key`(`teacherId`, `attendanceDate`, `attendanceType`, `scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `scheduleId` VARCHAR(191) NULL,
    `attendanceDate` VARCHAR(191) NOT NULL,
    `status` ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA') NOT NULL DEFAULT 'HADIR',
    `checkInTime` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `originDeviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `student_attendance_attendanceDate_classId_idx`(`attendanceDate`, `classId`),
    INDEX `student_attendance_attendanceDate_status_idx`(`attendanceDate`, `status`),
    UNIQUE INDEX `student_attendance_studentId_attendanceDate_scheduleId_key`(`studentId`, `attendanceDate`, `scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_corrections` (
    `id` VARCHAR(191) NOT NULL,
    `targetAttendanceId` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `oldStatus` VARCHAR(191) NOT NULL,
    `newStatus` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `correctedByUserId` VARCHAR(191) NOT NULL,
    `correctedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendance_corrections_targetAttendanceId_idx`(`targetAttendanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NOT NULL,
    `route` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNED',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `modules_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `oldData` TEXT NULL,
    `newData` TEXT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_devices` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sync_devices_deviceId_key`(`deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_changes` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `sync_changes_status_idx`(`status`),
    INDEX `sync_changes_deviceId_createdAt_idx`(`deviceId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_conflicts` (
    `id` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `localData` TEXT NOT NULL,
    `serverData` TEXT NOT NULL,
    `localVersion` INTEGER NOT NULL,
    `serverVersion` INTEGER NOT NULL,
    `resolution` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sync_conflicts_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign Keys
ALTER TABLE `school_settings` ADD CONSTRAINT `school_settings_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `academic_years` ADD CONSTRAINT `academic_years_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `semesters` ADD CONSTRAINT `semesters_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `students` ADD CONSTRAINT `students_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `classes` ADD CONSTRAINT `classes_homeroomTeacherId_fkey` FOREIGN KEY (`homeroomTeacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `classes` ADD CONSTRAINT `classes_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teaching_schedules` ADD CONSTRAINT `teaching_schedules_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teaching_schedules` ADD CONSTRAINT `teaching_schedules_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teaching_schedules` ADD CONSTRAINT `teaching_schedules_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teaching_schedules` ADD CONSTRAINT `teaching_schedules_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teaching_schedules` ADD CONSTRAINT `teaching_schedules_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `picket_schedules` ADD CONSTRAINT `picket_schedules_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_substitutions` ADD CONSTRAINT `teacher_substitutions_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `teaching_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `teacher_substitutions` ADD CONSTRAINT `teacher_substitutions_originalTeacherId_fkey` FOREIGN KEY (`originalTeacherId`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_substitutions` ADD CONSTRAINT `teacher_substitutions_replacementTeacherId_fkey` FOREIGN KEY (`replacementTeacherId`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_attendance` ADD CONSTRAINT `teacher_attendance_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teacher_attendance` ADD CONSTRAINT `teacher_attendance_teachingSchedule_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `teaching_schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_teachingSchedule_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `teaching_schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `sync_changes` ADD CONSTRAINT `sync_changes_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `sync_devices`(`deviceId`) ON DELETE CASCADE ON UPDATE CASCADE;
