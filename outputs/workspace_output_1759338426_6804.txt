import { pgTable, text, timestamp, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { academicSessions, shifts } from './organization';
import { users } from './users';

export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Class 1", "Grade 10"
  numericGrade: integer('numeric_grade'), // 1, 2, 3, etc.
  academicSessionId: uuid('academic_session_id').references(() => academicSessions.id).notNull(),
  shiftId: uuid('shift_id').references(() => shifts.id),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // A, B, C, etc.
  classId: uuid('class_id').references(() => classes.id).notNull(),
  capacity: integer('capacity').default(40),
  roomNumber: varchar('room_number', { length: 50 }),
  classTeacherId: uuid('class_teacher_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // theory, practical, both
  isOptional: boolean('is_optional').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const classSubjects = pgTable('class_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  teacherId: uuid('teacher_id').references(() => users.id),
  weeklyHours: integer('weekly_hours').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const syllabusTopics = pgTable('syllabus_topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  classSubjectId: uuid('class_subject_id').references(() => classSubjects.id).notNull(),
  topicName: varchar('topic_name', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').default(0),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type SyllabusTopic = typeof syllabusTopics.$inferSelect;