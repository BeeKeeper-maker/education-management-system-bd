import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getExamTypes,
  createExam,
  getExams,
  getExamById,
  createExamSubject,
  getStudentsForMarksEntry,
  saveMarks,
  getGradingSystem,
  processResults,
  getStudentResult,
  publishResults,
} from '../controllers/examinations.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get exam types (All authenticated users)
router.get('/types', getExamTypes);

// Get grading system (All authenticated users)
router.get('/grading-system', getGradingSystem);

// Create exam (Admins, SuperAdmins)
router.post(
  '/',
  authorize(['admin', 'superadmin']),
  createExam
);

// Get all exams (All authenticated users)
router.get('/', getExams);

// Get exam by ID (All authenticated users)
router.get('/:id', getExamById);

// Create exam subject schedule (Admins, SuperAdmins)
router.post(
  '/subjects',
  authorize(['admin', 'superadmin']),
  createExamSubject
);

// Get students for marks entry (Teachers, Admins, SuperAdmins)
router.get(
  '/subjects/:examSubjectId/students',
  authorize(['teacher', 'admin', 'superadmin']),
  getStudentsForMarksEntry
);

// Save marks (Teachers, Admins, SuperAdmins)
router.post(
  '/marks',
  authorize(['teacher', 'admin', 'superadmin']),
  saveMarks
);

// Process results (Admins, SuperAdmins)
router.post(
  '/results/process',
  authorize(['admin', 'superadmin']),
  processResults
);

// Get student result (All authenticated users)
router.get('/results/:examId/student/:studentId', getStudentResult);

// Publish results (Admins, SuperAdmins)
router.post(
  '/results/publish',
  authorize(['admin', 'superadmin']),
  publishResults
);

export default router;