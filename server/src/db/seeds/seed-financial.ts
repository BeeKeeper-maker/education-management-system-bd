import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { feeCategories, expenseCategories } from '../schema';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export async function seedFinancial() {
  console.log('🌱 Seeding financial data...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Seed fee categories
    const feeCategoriesData = [
      { name: 'Tuition Fee', description: 'Monthly tuition fee', isActive: true },
      { name: 'Admission Fee', description: 'One-time admission fee', isActive: true },
      { name: 'Exam Fee', description: 'Examination fee', isActive: true },
      { name: 'Library Fee', description: 'Library membership and usage fee', isActive: true },
      { name: 'Lab Fee', description: 'Laboratory usage fee', isActive: true },
      { name: 'Sports Fee', description: 'Sports and physical education fee', isActive: true },
      { name: 'Transport Fee', description: 'School bus transportation fee', isActive: true },
      { name: 'Development Fee', description: 'Infrastructure development fee', isActive: true },
      { name: 'Computer Fee', description: 'Computer lab and IT resources fee', isActive: true },
      { name: 'Annual Charges', description: 'Annual miscellaneous charges', isActive: true },
    ];

    await db.insert(feeCategories).values(feeCategoriesData);
    console.log('✅ Fee categories seeded');

    // Seed expense categories
    const expenseCategoriesData = [
      { name: 'Salaries', description: 'Staff and teacher salaries', isActive: true },
      { name: 'Utilities', description: 'Electricity, water, internet bills', isActive: true },
      { name: 'Maintenance', description: 'Building and equipment maintenance', isActive: true },
      { name: 'Supplies', description: 'Office and classroom supplies', isActive: true },
      { name: 'Equipment', description: 'Furniture and equipment purchases', isActive: true },
      { name: 'Transportation', description: 'Vehicle fuel and maintenance', isActive: true },
      { name: 'Marketing', description: 'Advertising and promotional expenses', isActive: true },
      { name: 'Insurance', description: 'Insurance premiums', isActive: true },
      { name: 'Professional Services', description: 'Legal, accounting, consulting fees', isActive: true },
      { name: 'Miscellaneous', description: 'Other miscellaneous expenses', isActive: true },
    ];

    await db.insert(expenseCategories).values(expenseCategoriesData);
    console.log('✅ Expense categories seeded');

    console.log('✅ Financial data seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
seedFinancial()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));