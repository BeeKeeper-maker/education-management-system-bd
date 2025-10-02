import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { periods, examTypes, gradingSystem } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function seedNewData() {
  console.log('🌱 Seeding new data (periods, exam types, grading system)...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Create Periods
    const periodsData = [
      { name: 'Period 1', startTime: '08:00', endTime: '08:45', orderIndex: 1, isBreak: false },
      { name: 'Period 2', startTime: '08:45', endTime: '09:30', orderIndex: 2, isBreak: false },
      { name: 'Period 3', startTime: '09:30', endTime: '10:15', orderIndex: 3, isBreak: false },
      { name: 'Short Break', startTime: '10:15', endTime: '10:30', orderIndex: 4, isBreak: true },
      { name: 'Period 4', startTime: '10:30', endTime: '11:15', orderIndex: 5, isBreak: false },
      { name: 'Period 5', startTime: '11:15', endTime: '12:00', orderIndex: 6, isBreak: false },
      { name: 'Lunch Break', startTime: '12:00', endTime: '12:45', orderIndex: 7, isBreak: true },
      { name: 'Period 6', startTime: '12:45', endTime: '13:30', orderIndex: 8, isBreak: false },
      { name: 'Period 7', startTime: '13:30', endTime: '14:15', orderIndex: 9, isBreak: false },
    ];

    await db.insert(periods).values(periodsData);
    console.log('✅ Periods created');

    // Create Exam Types
    const examTypesData = [
      { name: 'First Terminal', description: 'First terminal examination', weightage: 25, isActive: true },
      { name: 'Mid Terminal', description: 'Mid terminal examination', weightage: 25, isActive: true },
      { name: 'Final Terminal', description: 'Final terminal examination', weightage: 50, isActive: true },
      { name: 'Class Test', description: 'Regular class tests', weightage: 10, isActive: true },
      { name: 'Quiz', description: 'Quick assessment quizzes', weightage: 5, isActive: true },
    ];

    await db.insert(examTypes).values(examTypesData);
    console.log('✅ Exam types created');

    // Create Grading System
    const gradingSystemData = [
      { name: 'A+', minPercentage: '90', maxPercentage: '100', grade: 'A+', gradePoint: '5.00', description: 'Outstanding', isActive: true },
      { name: 'A', minPercentage: '80', maxPercentage: '89.99', grade: 'A', gradePoint: '4.00', description: 'Excellent', isActive: true },
      { name: 'A-', minPercentage: '70', maxPercentage: '79.99', grade: 'A-', gradePoint: '3.50', description: 'Very Good', isActive: true },
      { name: 'B', minPercentage: '60', maxPercentage: '69.99', grade: 'B', gradePoint: '3.00', description: 'Good', isActive: true },
      { name: 'C', minPercentage: '50', maxPercentage: '59.99', grade: 'C', gradePoint: '2.50', description: 'Satisfactory', isActive: true },
      { name: 'D', minPercentage: '40', maxPercentage: '49.99', grade: 'D', gradePoint: '2.00', description: 'Pass', isActive: true },
      { name: 'F', minPercentage: '0', maxPercentage: '39.99', grade: 'F', gradePoint: '0.00', description: 'Fail', isActive: true },
    ];

    await db.insert(gradingSystem).values(gradingSystemData);
    console.log('✅ Grading system created');

    console.log('\n🎉 New data seeded successfully!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

seedNewData();