import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // info, success, warning, error
  category: varchar('category', { length: 50 }), // attendance, exam, fee, announcement, etc.
  isRead: boolean('is_read').default(false).notNull(),
  link: varchar('link', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  parentMessageId: uuid('parent_message_id').references(() => messages.id), // For threading
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;