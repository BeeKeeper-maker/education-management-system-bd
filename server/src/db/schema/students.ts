import { pgTable, text, timestamp, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { classes, sections } from './academic';
import { academicSessions } from './organization';

export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  studentId: varchar('student_id', { length: 50 }).unique().notNull(), // Unique student ID
  admissionNumber: varchar('admission_number', { length: 50 }).unique(),
  admissionDate: timestamp('admission_date').notNull(),
  rollNumber: varchar('roll_number', { length: 50 }),
  guardianName: varchar('guardian_name', { length: 255 }),
  guardianPhone: varchar('guardian_phone', { length: 20 }),
  guardianEmail: varchar('guardian_email', { length: 255 }),
  guardianRelation: varchar('guardian_relation', { length: 50 }), // father, mother, guardian
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  previousSchool: varchar('previous_school', { length: 255 }),
  medicalInfo: text('medical_info'),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, inactive, graduated, transferred
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  academicSessionId: uuid('academic_session_id').references(() => academicSessions.id).notNull(),
  enrollmentDate: timestamp('enrollment_date').defaultNow().notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, completed, transferred
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const guardians = pgTable('guardians', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  occupation: varchar('occupation', { length: 255 }),
  income: varchar('income', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentGuardians = pgTable('student_guardians', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  guardianId: uuid('guardian_id').references(() => guardians.id).notNull(),
  relation: varchar('relation', { length: 50 }).notNull(), // father, mother, guardian, other
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type StudentGuardian = typeof studentGuardians.$inferSelect;