import { pgTable, text, timestamp, uuid, varchar, date } from 'drizzle-orm/pg-core';
import { users } from './users';
import { classes, sections } from './academic';

export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // present, absent, late, half_day, leave
  checkInTime: varchar('check_in_time', { length: 10 }), // HH:MM format
  checkOutTime: varchar('check_out_time', { length: 10 }),
  remarks: text('remarks'),
  markedBy: uuid('marked_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const classAttendance = pgTable('class_attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  date: date('date').notNull(),
  period: varchar('period', { length: 50 }),
  markedBy: uuid('marked_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaveApplications = pgTable('leave_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(), // sick, casual, emergency, other
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, rejected
  approvedBy: uuid('approved_by').references(() => users.id),
  approvalDate: timestamp('approval_date'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type ClassAttendance = typeof classAttendance.$inferSelect;
export type LeaveApplication = typeof leaveApplications.$inferSelect;