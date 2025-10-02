import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import studentsRoutes from './students.routes';
import academicRoutes from './academic.routes';
import attendanceRoutes from './attendance.routes';
import timetableRoutes from './timetable.routes';
import examinationsRoutes from './examinations.routes';
import feesRoutes from './fees.routes';
import expensesRoutes from './expenses.routes';
import hostelRoutes from './hostel.routes';
import libraryRoutes from './library.routes';
import announcementsRoutes from './announcements.routes';
import notificationsRoutes from './notifications.routes';
import smsRoutes from './sms.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/students', studentsRoutes);
router.use('/academic', academicRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/timetable', timetableRoutes);
router.use('/examinations', examinationsRoutes);
router.use('/fees', feesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/hostel', hostelRoutes);
router.use('/library', libraryRoutes);
   router.use('/announcements', announcementsRoutes);
   router.use('/notifications', notificationsRoutes);
   router.use('/sms', smsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;