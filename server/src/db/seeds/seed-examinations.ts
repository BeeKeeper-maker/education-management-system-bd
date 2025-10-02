import { db } from '../index';
import { examTypes, gradingSystem } from '../schema';

export async function seedExaminations() {
  console.log('🌱 Seeding examination data...');

  // Seed exam types
  const examTypesData = [
    {
      name: 'First Terminal',
      description: 'First terminal examination',
      weightage: 25,
      isActive: true,
    },
    {
      name: 'Mid Terminal',
      description: 'Mid terminal examination',
      weightage: 25,
      isActive: true,
    },
    {
      name: 'Final Terminal',
      description: 'Final terminal examination',
      weightage: 50,
      isActive: true,
    },
    {
      name: 'Class Test',
      description: 'Regular class tests',
      weightage: 10,
      isActive: true,
    },
    {
      name: 'Quiz',
      description: 'Quick assessment quizzes',
      weightage: 5,
      isActive: true,
    },
  ];

  await db.insert(examTypes).values(examTypesData);
  console.log('✅ Exam types seeded');

  // Seed grading system (standard grading scale)
  const gradingSystemData = [
    {
      name: 'A+',
      minPercentage: '90',
      maxPercentage: '100',
      grade: 'A+',
      gradePoint: '5.00',
      description: 'Outstanding',
      isActive: true,
    },
    {
      name: 'A',
      minPercentage: '80',
      maxPercentage: '89.99',
      grade: 'A',
      gradePoint: '4.00',
      description: 'Excellent',
      isActive: true,
    },
    {
      name: 'A-',
      minPercentage: '70',
      maxPercentage: '79.99',
      grade: 'A-',
      gradePoint: '3.50',
      description: 'Very Good',
      isActive: true,
    },
    {
      name: 'B',
      minPercentage: '60',
      maxPercentage: '69.99',
      grade: 'B',
      gradePoint: '3.00',
      description: 'Good',
      isActive: true,
    },
    {
      name: 'C',
      minPercentage: '50',
      maxPercentage: '59.99',
      grade: 'C',
      gradePoint: '2.50',
      description: 'Satisfactory',
      isActive: true,
    },
    {
      name: 'D',
      minPercentage: '40',
      maxPercentage: '49.99',
      grade: 'D',
      gradePoint: '2.00',
      description: 'Pass',
      isActive: true,
    },
    {
      name: 'F',
      minPercentage: '0',
      maxPercentage: '39.99',
      grade: 'F',
      gradePoint: '0.00',
      description: 'Fail',
      isActive: true,
    },
  ];

  await db.insert(gradingSystem).values(gradingSystemData);
  console.log('✅ Grading system seeded');

  console.log('✅ Examination data seeded successfully');
}