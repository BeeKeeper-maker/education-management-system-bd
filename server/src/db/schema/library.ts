import { pgTable, uuid, varchar, integer, timestamp, text, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { students } from './students';
import { users } from './users';

// Books table
export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  isbn: varchar('isbn', { length: 20 }),
  publisher: varchar('publisher', { length: 255 }),
  publicationYear: integer('publication_year'),
  category: varchar('category', { length: 100 }).notNull(), // 'Fiction', 'Science', 'Mathematics', etc.
  language: varchar('language', { length: 50 }).default('English'),
  edition: varchar('edition', { length: 50 }),
  pages: integer('pages'),
  totalQuantity: integer('total_quantity').notNull(),
  availableQuantity: integer('available_quantity').notNull(),
  shelfLocation: varchar('shelf_location', { length: 50 }),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 255 }),
  price: integer('price').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Book Issues table
export const bookIssues = pgTable('book_issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookId: uuid('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  status: varchar('status', { length: 20 }).default('issued').notNull(), // 'issued', 'returned', 'overdue', 'lost'
  fineAmount: integer('fine_amount').default(0),
  remarks: text('remarks'),
  issuedBy: uuid('issued_by').references(() => users.id),
  returnedBy: uuid('returned_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const booksRelations = relations(books, ({ many }) => ({
  issues: many(bookIssues),
}));

export const bookIssuesRelations = relations(bookIssues, ({ one }) => ({
  book: one(books, {
    fields: [bookIssues.bookId],
    references: [books.id],
  }),
  student: one(students, {
    fields: [bookIssues.studentId],
    references: [students.id],
  }),
  issuedByUser: one(users, {
    fields: [bookIssues.issuedBy],
    references: [users.id],
  }),
  returnedByUser: one(users, {
    fields: [bookIssues.returnedBy],
    references: [users.id],
  }),
}));