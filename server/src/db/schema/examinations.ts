import { pgTable, text, timestamp, uuid, varchar, integer, decimal, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { classes, sections, subjects } from './academic';
import { academicSessions } from './organization';
import { students } from './students';
import { users } from './users';

// Exam types (Midterm, Final, Quiz, etc.)
export const examTypes = pgTable('exam_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  weightage: integer('weightage').notNull().default(100), // Percentage weightage in final grade
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Exams (instances of exam types)
export const exams = pgTable('exams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  examTypeId: uuid('exam_type_id').references(() => examTypes.id).notNull(),
  academicSessionId: uuid('academic_session_id').references(() => academicSessions.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  isPublished: boolean('is_published').default(false).notNull(),
  resultsPublished: boolean('results_published').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Exam schedules (subject-wise exam details)
export const examSubjects = pgTable('exam_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id).notNull(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  examDate: date('exam_date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(),
  duration: integer('duration').notNull(), // in minutes
  totalMarks: integer('total_marks').notNull(),
  passingMarks: integer('passing_marks').notNull(),
  roomNumber: varchar('room_number', { length: 50 }),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Student marks
export const marks = pgTable('marks', {
  id: uuid('id').defaultRandom().primaryKey(),
  examSubjectId: uuid('exam_subject_id').references(() => examSubjects.id).notNull(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }),
  isAbsent: boolean('is_absent').default(false).notNull(),
  remarks: text('remarks'),
  enteredBy: uuid('entered_by').references(() => users.id).notNull(),
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Grading system configuration
export const gradingSystem = pgTable('grading_system', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  minPercentage: decimal('min_percentage', { precision: 5, scale: 2 }).notNull(),
  maxPercentage: decimal('max_percentage', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 10 }).notNull(), // A+, A, B+, etc.
  gradePoint: decimal('grade_point', { precision: 3, scale: 2 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Processed results (cached for performance)
export const results = pgTable('results', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id).notNull(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  totalMarks: integer('total_marks').notNull(),
  marksObtained: decimal('marks_obtained', { precision: 6, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 10 }).notNull(),
  gradePoint: decimal('grade_point', { precision: 3, scale: 2 }).notNull(),
  meritPosition: integer('merit_position'),
  remarks: text('remarks'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subject-wise results (detailed breakdown)
export const subjectResults = pgTable('subject_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  resultId: uuid('result_id').references(() => results.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  totalMarks: integer('total_marks').notNull(),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 10 }).notNull(),
  gradePoint: decimal('grade_point', { precision: 3, scale: 2 }).notNull(),
  isPassed: boolean('is_passed').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const examTypesRelations = relations(examTypes, ({ many }) => ({
  exams: many(exams),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  examType: one(examTypes, {
    fields: [exams.examTypeId],
    references: [examTypes.id],
  }),
  academicSession: one(academicSessions, {
    fields: [exams.academicSessionId],
    references: [academicSessions.id],
  }),
  examSubjects: many(examSubjects),
  results: many(results),
}));

export const examSubjectsRelations = relations(examSubjects, ({ one, many }) => ({
  exam: one(exams, {
    fields: [examSubjects.examId],
    references: [exams.id],
  }),
  class: one(classes, {
    fields: [examSubjects.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [examSubjects.sectionId],
    references: [sections.id],
  }),
  subject: one(subjects, {
    fields: [examSubjects.subjectId],
    references: [subjects.id],
  }),
  marks: many(marks),
}));

export const marksRelations = relations(marks, ({ one }) => ({
  examSubject: one(examSubjects, {
    fields: [marks.examSubjectId],
    references: [examSubjects.id],
  }),
  student: one(students, {
    fields: [marks.studentId],
    references: [students.id],
  }),
}));

export const resultsRelations = relations(results, ({ one, many }) => ({
  exam: one(exams, {
    fields: [results.examId],
    references: [exams.id],
  }),
  student: one(students, {
    fields: [results.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [results.classId],
    references: [classes.id],
  }),
  section: one(sections, {
    fields: [results.sectionId],
    references: [sections.id],
  }),
  subjectResults: many(subjectResults),
}));

export const subjectResultsRelations = relations(subjectResults, ({ one }) => ({
  result: one(results, {
    fields: [subjectResults.resultId],
    references: [results.id],
  }),
  subject: one(subjects, {
    fields: [subjectResults.subjectId],
    references: [subjects.id],
  }),
}));

// Type exports
export type ExamType = typeof examTypes.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamSubject = typeof examSubjects.$inferSelect;
export type Mark = typeof marks.$inferSelect;
export type GradingSystem = typeof gradingSystem.$inferSelect;
export type Result = typeof results.$inferSelect;
export type SubjectResult = typeof subjectResults.$inferSelect;