import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getPeriods,
  createTimetableEntry,
  getClassTimetable,
  getTeacherTimetable,
  deleteTimetableEntry,
  checkConflicts,
} from '../controllers/timetable.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all periods (All authenticated users)
router.get('/periods', getPeriods);

// Create/update timetable entry (Admins, SuperAdmins)
router.post(
  '/entries',
  authorize(['admin', 'superadmin']),
  createTimetableEntry
);

// Get class timetable (All authenticated users)
router.get('/class', getClassTimetable);

// Get teacher timetable (All authenticated users)
router.get('/teacher/:teacherId', getTeacherTimetable);

// Delete timetable entry (Admins, SuperAdmins)
router.delete(
  '/entries/:id',
  authorize(['admin', 'superadmin']),
  deleteTimetableEntry
);

// Check for conflicts (Admins, SuperAdmins)
router.get(
  '/conflicts',
  authorize(['admin', 'superadmin']),
  checkConflicts
);

export default router;