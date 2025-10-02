import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // superadmin, admin, teacher, student, guardian, accountant, hostel_manager
  profileImageUrl: text('profile_image_url'),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 10 }), // male, female, other
  bloodGroup: varchar('blood_group', { length: 5 }), // A+, A-, B+, B-, O+, O-, AB+, AB-
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: text('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;