import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Announcements Table
 * Central notice board for posting announcements to different audiences
 */
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  
  // Audience targeting
  targetAudience: varchar('target_audience', { length: 50 }).notNull(), // 'all', 'students', 'teachers', 'guardians', 'staff', 'class_specific'
  targetClasses: jsonb('target_classes').$type<string[]>(), // Array of class IDs for class-specific announcements
  
  // Priority and visibility
  priority: varchar('priority', { length: 20 }).notNull().default('normal'), // 'low', 'normal', 'high', 'urgent'
  isPinned: boolean('is_pinned').notNull().default(false),
  
  // Scheduling
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'), // Optional expiry date
  
  // Metadata
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Attachments (optional)
  attachments: jsonb('attachments').$type<{ name: string; url: string }[]>(),
});

/**
 * Notifications Table
 * User-specific notifications for various system events
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Notification content
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'announcement', 'attendance', 'fee', 'exam', 'library', 'general'
  
  // Status
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  
  // Related entity (optional)
  relatedEntityType: varchar('related_entity_type', { length: 50}), // 'announcement', 'fee', 'book', etc.
  relatedEntityId: uuid('related_entity_id'),
  
  // Action link (optional)
  actionUrl: varchar('action_url', { length: 500 }),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * SMS Logs Table
 * Track all SMS sent through the system
 */
export const smsLogs = pgTable('sms_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Recipient info
  recipientUserId: uuid('recipient_user_id').references(() => users.id),
  recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }),
  
  // Message content
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(), // 'attendance', 'fee', 'library', 'announcement', 'general'
  
  // Status tracking
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'sent', 'failed', 'delivered'
  provider: varchar('provider', { length: 50 }).default('mock'), // 'mock', 'twilio', 'nexmo', etc.
  providerId: varchar('provider_id', { length: 255 }), // External provider's message ID
  
  // Error tracking
  errorMessage: text('error_message'),
  
  // Related entity (optional)
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: uuid('related_entity_id'),
  
  // Metadata
  sentBy: uuid('sent_by').references(() => users.id),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at'),
  
  // Cost tracking (optional)
  cost: varchar('cost', { length: 20 }), // Store as string to avoid decimal issues
});

// Export types
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type SmsLog = typeof smsLogs.$inferSelect;
export type NewSmsLog = typeof smsLogs.$inferInsert;