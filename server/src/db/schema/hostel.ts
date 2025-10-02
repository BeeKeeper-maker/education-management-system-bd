import { pgTable, uuid, varchar, integer, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { students } from './students';
import { users } from './users';

// Hostels table
export const hostels = pgTable('hostels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'boys', 'girls', 'mixed'
  totalCapacity: integer('total_capacity').notNull(),
  occupiedCapacity: integer('occupied_capacity').default(0).notNull(),
  address: text('address'),
  wardenId: uuid('warden_id').references(() => users.id),
  wardenName: varchar('warden_name', { length: 100 }),
  wardenPhone: varchar('warden_phone', { length: 20 }),
  facilities: text('facilities'), // JSON string of facilities
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Rooms table
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id').references(() => hostels.id, { onDelete: 'cascade' }).notNull(),
  roomNumber: varchar('room_number', { length: 20 }).notNull(),
  floor: integer('floor').notNull(),
  capacity: integer('capacity').notNull(),
  occupiedCapacity: integer('occupied_capacity').default(0).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'single', 'double', 'triple', 'dormitory'
  facilities: text('facilities'), // JSON string of facilities (AC, attached bathroom, etc.)
  monthlyRent: integer('monthly_rent').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Room Allocations table
export const roomAllocations = pgTable('room_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  allocationDate: timestamp('allocation_date').notNull(),
  vacateDate: timestamp('vacate_date'),
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active', 'vacated', 'transferred'
  bedNumber: varchar('bed_number', { length: 10 }),
  monthlyRent: integer('monthly_rent').default(0),
  remarks: text('remarks'),
  allocatedBy: uuid('allocated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const hostelsRelations = relations(hostels, ({ many, one }) => ({
  rooms: many(rooms),
  warden: one(users, {
    fields: [hostels.wardenId],
    references: [users.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  hostel: one(hostels, {
    fields: [rooms.hostelId],
    references: [hostels.id],
  }),
  allocations: many(roomAllocations),
}));

export const roomAllocationsRelations = relations(roomAllocations, ({ one }) => ({
  room: one(rooms, {
    fields: [roomAllocations.roomId],
    references: [rooms.id],
  }),
  student: one(students, {
    fields: [roomAllocations.studentId],
    references: [students.id],
  }),
  allocatedByUser: one(users, {
    fields: [roomAllocations.allocatedBy],
    references: [users.id],
  }),
}));