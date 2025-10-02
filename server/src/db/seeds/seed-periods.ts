import { db } from '../index';
import { periods } from '../schema';

export async function seedPeriods() {
  console.log('🌱 Seeding periods data...');

  const periodsData = [
    {
      name: 'Period 1',
      startTime: '08:00',
      endTime: '08:45',
      orderIndex: 1,
      isBreak: false,
    },
    {
      name: 'Period 2',
      startTime: '08:45',
      endTime: '09:30',
      orderIndex: 2,
      isBreak: false,
    },
    {
      name: 'Period 3',
      startTime: '09:30',
      endTime: '10:15',
      orderIndex: 3,
      isBreak: false,
    },
    {
      name: 'Short Break',
      startTime: '10:15',
      endTime: '10:30',
      orderIndex: 4,
      isBreak: true,
    },
    {
      name: 'Period 4',
      startTime: '10:30',
      endTime: '11:15',
      orderIndex: 5,
      isBreak: false,
    },
    {
      name: 'Period 5',
      startTime: '11:15',
      endTime: '12:00',
      orderIndex: 6,
      isBreak: false,
    },
    {
      name: 'Lunch Break',
      startTime: '12:00',
      endTime: '12:45',
      orderIndex: 7,
      isBreak: true,
    },
    {
      name: 'Period 6',
      startTime: '12:45',
      endTime: '13:30',
      orderIndex: 8,
      isBreak: false,
    },
    {
      name: 'Period 7',
      startTime: '13:30',
      endTime: '14:15',
      orderIndex: 9,
      isBreak: false,
    },
  ];

  await db.insert(periods).values(periodsData);
  console.log('✅ Periods seeded successfully');
}