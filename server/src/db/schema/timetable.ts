import { pgTable, text, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { classes, sections, subjects } from './academic';
import { users } from './users';

export const periods = pgTable('periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // Period 1, Period 2, Break, etc.
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  isBreak: boolean('is_break').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timetableEntries = pgTable('timetable_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id),
  teacherId: uuid('teacher_id').references(() => users.id),
  periodId: uuid('period_id').references(() => periods.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  roomNumber: varchar('room_number', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const examSchedules = pgTable('exam_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  examName: varchar('exam_name', { length: 255 }).notNull(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  examDate: date('exam_date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  roomNumber: varchar('room_number', { length: 50 }),
  totalMarks: integer('total_marks').notNull(),
  passingMarks: integer('passing_marks').notNull(),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Period = typeof periods.$inferSelect;
export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type ExamSchedule = typeof examSchedules.$inferSelect;

// Import date and boolean
import { date, boolean } from 'drizzle-orm/pg-core';