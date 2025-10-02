import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users, institutions, academicSessions, shifts, classes, sections, subjects, periods, examTypes, gradingSystem, hostels, books } from './schema';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function seed() {
  console.log('🌱 Seeding database...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Create institution
    const [institution] = await db.insert(institutions).values({
      name: 'EduPro Institute',
      address: '123 Education Street, City, Country',
      phone: '+1234567890',
      email: 'info@edupro.com',
      website: 'https://edupro.com',
      establishedYear: 2020,
      principalName: 'Dr. John Smith',
      motto: 'Excellence in Education',
      description: 'A leading educational institution committed to excellence',
    }).returning();

    console.log('✅ Institution created');

    // Create academic session
    const [session] = await db.insert(academicSessions).values({
      name: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: true,
    }).returning();

    console.log('✅ Academic session created');

    // Create shifts
    const [morningShift] = await db.insert(shifts).values({
      name: 'Morning',
      startTime: '08:00',
      endTime: '13:00',
    }).returning();

    const [dayShift] = await db.insert(shifts).values({
      name: 'Day',
      startTime: '13:00',
      endTime: '18:00',
    }).returning();

    console.log('✅ Shifts created');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // Create SuperAdmin
    const [superAdmin] = await db.insert(users).values({
      email: 'superadmin@edupro.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      phone: '+1234567891',
      isActive: true,
    }).returning();

    console.log('✅ SuperAdmin created');

    // Create Admin
    const [admin] = await db.insert(users).values({
      email: 'admin@edupro.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+1234567892',
      isActive: true,
    }).returning();

    console.log('✅ Admin created');

    // Create Teacher
    const [teacher] = await db.insert(users).values({
      email: 'teacher@edupro.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: 'teacher',
      phone: '+1234567893',
      gender: 'male',
      isActive: true,
    }).returning();

    console.log('✅ Teacher created');

    // Create Student
    const [student] = await db.insert(users).values({
      email: 'student@edupro.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'student',
      phone: '+1234567894',
      gender: 'female',
      dateOfBirth: new Date('2010-01-15'),
      isActive: true,
    }).returning();

    console.log('✅ Student created');

    // Create Guardian
    const [guardian] = await db.insert(users).values({
      email: 'guardian@edupro.com',
      password: hashedPassword,
      firstName: 'Robert',
      lastName: 'Guardian',
      role: 'guardian',
      phone: '+1234567895',
      isActive: true,
    }).returning();

    console.log('✅ Guardian created');

    // Create Classes
    const classesData = [
      { name: 'Class 1', numericGrade: 1, academicSessionId: session.id, shiftId: morningShift.id },
      { name: 'Class 2', numericGrade: 2, academicSessionId: session.id, shiftId: morningShift.id },
      { name: 'Class 3', numericGrade: 3, academicSessionId: session.id, shiftId: morningShift.id },
      { name: 'Class 4', numericGrade: 4, academicSessionId: session.id, shiftId: morningShift.id },
      { name: 'Class 5', numericGrade: 5, academicSessionId: session.id, shiftId: morningShift.id },
    ];

    const createdClasses = await db.insert(classes).values(classesData).returning();
    console.log('✅ Classes created');

    // Create Sections for each class
    for (const cls of createdClasses) {
      await db.insert(sections).values([
        { name: 'A', classId: cls.id, capacity: 40, roomNumber: `${cls.numericGrade}A`, classTeacherId: teacher.id },
        { name: 'B', classId: cls.id, capacity: 40, roomNumber: `${cls.numericGrade}B` },
      ]);
    }

    console.log('✅ Sections created');

    // Create Subjects
    const subjectsData = [
      { name: 'Mathematics', code: 'MATH', type: 'theory' },
      { name: 'English', code: 'ENG', type: 'theory' },
      { name: 'Science', code: 'SCI', type: 'both' },
      { name: 'Social Studies', code: 'SS', type: 'theory' },
      { name: 'Computer Science', code: 'CS', type: 'both' },
      { name: 'Physical Education', code: 'PE', type: 'practical' },
    ];

    await db.insert(subjects).values(subjectsData);
    console.log('✅ Subjects created');

    // Seed Hostels
    console.log('\n🏨 Seeding hostel data...');
    const hostelData = [
      {
        name: "Boys' Hostel A",
        type: 'boys',
        totalCapacity: 100,
        address: '123 Campus Road, University Area',
        wardenName: 'Mr. John Smith',
        wardenPhone: '+1234567890',
        facilities: JSON.stringify(['WiFi', 'Gym', 'Common Room', 'Laundry', 'Cafeteria']),
        description: 'Modern hostel facility for male students',
      },
      {
        name: "Girls' Hostel B",
        type: 'girls',
        totalCapacity: 80,
        address: '456 Campus Road, University Area',
        wardenName: 'Ms. Sarah Johnson',
        wardenPhone: '+1234567891',
        facilities: JSON.stringify(['WiFi', 'Gym', 'Common Room', 'Laundry', 'Cafeteria', '24/7 Security']),
        description: 'Safe and comfortable hostel for female students',
      },
    ];

    await db.insert(hostels).values(hostelData);
    console.log('✅ Hostels created');

    // Seed Books
    console.log('\n📚 Seeding library data...');
    const bookData = [
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-06-112008-4',
        category: 'Fiction',
        totalQuantity: 5,
        availableQuantity: 5,
        shelfLocation: 'A-101',
        price: 1500,
      },
      {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0-262-03384-8',
        category: 'Computer Science',
        totalQuantity: 8,
        availableQuantity: 8,
        shelfLocation: 'C-301',
        price: 3500,
      },
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '978-0-06-231609-7',
        category: 'History',
        totalQuantity: 6,
        availableQuantity: 6,
        shelfLocation: 'E-501',
        price: 2000,
      },
    ];

    await db.insert(books).values(bookData);
    console.log('✅ Books created');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SuperAdmin: superadmin@edupro.com / Password@123');
    console.log('Admin:      admin@edupro.com / Password@123');
    console.log('Teacher:    teacher@edupro.com / Password@123');
    console.log('Student:    student@edupro.com / Password@123');
    console.log('Guardian:   guardian@edupro.com / Password@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

seed();