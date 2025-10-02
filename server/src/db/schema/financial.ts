import { pgTable, text, timestamp, uuid, varchar, integer, decimal, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { students } from './students';
import { classes } from './academic';
import { users } from './users';
import { academicSessions } from './organization';

// Fee categories (Tuition, Exam, Admission, etc.)
export const feeCategories = pgTable('fee_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Fee structure templates
export const feeStructures = pgTable('fee_structures', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  academicSessionId: uuid('academic_session_id').references(() => academicSessions.id).notNull(),
  classId: uuid('class_id').references(() => classes.id),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Fee structure items (breakdown of fees)
export const feeStructureItems = pgTable('fee_structure_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  feeStructureId: uuid('fee_structure_id').references(() => feeStructures.id).notNull(),
  feeCategoryId: uuid('fee_category_id').references(() => feeCategories.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date'),
  isOptional: boolean('is_optional').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Student fee assignments
export const studentFees = pgTable('student_fees', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  feeStructureId: uuid('fee_structure_id').references(() => feeStructures.id).notNull(),
  academicSessionId: uuid('academic_session_id').references(() => academicSessions.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  waiverAmount: decimal('waiver_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  dueAmount: decimal('due_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, partial, paid, overdue
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Fee payments
export const feePayments = pgTable('fee_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentFeeId: uuid('student_fee_id').references(() => studentFees.id).notNull(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // cash, card, bank_transfer, cheque, online
  transactionId: varchar('transaction_id', { length: 255 }),
  receiptNumber: varchar('receipt_number', { length: 100 }).notNull().unique(),
  remarks: text('remarks'),
  collectedBy: uuid('collected_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Discounts and waivers
export const feeDiscounts = pgTable('fee_discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentFeeId: uuid('student_fee_id').references(() => studentFees.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // discount, waiver
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  reason: text('reason').notNull(),
  approvedBy: uuid('approved_by').references(() => users.id).notNull(),
  approvedAt: timestamp('approved_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Expense categories
export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => expenseCategories.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  expenseDate: date('expense_date').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  vendorName: varchar('vendor_name', { length: 255 }),
  remarks: text('remarks'),
  recordedBy: uuid('recorded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const feeCategoriesRelations = relations(feeCategories, ({ many }) => ({
  feeStructureItems: many(feeStructureItems),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  academicSession: one(academicSessions, {
    fields: [feeStructures.academicSessionId],
    references: [academicSessions.id],
  }),
  class: one(classes, {
    fields: [feeStructures.classId],
    references: [classes.id],
  }),
  items: many(feeStructureItems),
  studentFees: many(studentFees),
}));

export const feeStructureItemsRelations = relations(feeStructureItems, ({ one }) => ({
  feeStructure: one(feeStructures, {
    fields: [feeStructureItems.feeStructureId],
    references: [feeStructures.id],
  }),
  feeCategory: one(feeCategories, {
    fields: [feeStructureItems.feeCategoryId],
    references: [feeCategories.id],
  }),
}));

export const studentFeesRelations = relations(studentFees, ({ one, many }) => ({
  student: one(students, {
    fields: [studentFees.studentId],
    references: [students.id],
  }),
  feeStructure: one(feeStructures, {
    fields: [studentFees.feeStructureId],
    references: [feeStructures.id],
  }),
  academicSession: one(academicSessions, {
    fields: [studentFees.academicSessionId],
    references: [academicSessions.id],
  }),
  payments: many(feePayments),
  discounts: many(feeDiscounts),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [feePayments.studentFeeId],
    references: [studentFees.id],
  }),
  student: one(students, {
    fields: [feePayments.studentId],
    references: [students.id],
  }),
  collectedBy: one(users, {
    fields: [feePayments.collectedBy],
    references: [users.id],
  }),
}));

export const feeDiscountsRelations = relations(feeDiscounts, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [feeDiscounts.studentFeeId],
    references: [studentFees.id],
  }),
  approvedBy: one(users, {
    fields: [feeDiscounts.approvedBy],
    references: [users.id],
  }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  recordedBy: one(users, {
    fields: [expenses.recordedBy],
    references: [users.id],
  }),
}));

// Type exports
export type FeeCategory = typeof feeCategories.$inferSelect;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type FeeStructureItem = typeof feeStructureItems.$inferSelect;
export type StudentFee = typeof studentFees.$inferSelect;
export type FeePayment = typeof feePayments.$inferSelect;
export type FeeDiscount = typeof feeDiscounts.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;