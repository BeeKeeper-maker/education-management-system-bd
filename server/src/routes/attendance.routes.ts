import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  markAttendance,
  getAttendanceByDate,
  getAttendanceStats,
  getStudentAttendance,
  finalizeAttendance,
} from '../controllers/attendance.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Mark attendance (Teachers, Admins, SuperAdmins)
router.post(
  '/',
  authorize(['teacher', 'admin', 'superadmin']),
  markAttendance
);

// Get attendance by date (Teachers, Admins, SuperAdmins)
router.get(
  '/date',
  authorize(['teacher', 'admin', 'superadmin']),
  getAttendanceByDate
);

// Get attendance statistics (Teachers, Admins, SuperAdmins)
router.get(
  '/stats',
  authorize(['teacher', 'admin', 'superadmin']),
  getAttendanceStats
);

// Get student-specific attendance (All roles can view their own/related student data)
router.get(
  '/student/:studentId',
  getStudentAttendance
);

// Finalize attendance (Admins, SuperAdmins only)
router.post(
  '/finalize',
  authorize(['admin', 'superadmin']),
  finalizeAttendance
);

export default router;