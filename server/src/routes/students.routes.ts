import { Router } from 'express';
import { StudentsController } from '../controllers/students.controller';
import { validateBody } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const studentsController = new StudentsController();

// Validation schemas
const createStudentSchema = z.object({
  // User information
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().optional(),
  
  // Student specific information
  admissionNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  rollNumber: z.string().optional(),
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianPhone: z.string().min(1, 'Guardian phone is required'),
  guardianEmail: z.string().email().optional(),
  guardianRelation: z.string().optional(),
  emergencyContact: z.string().optional(),
  previousSchool: z.string().optional(),
  medicalInfo: z.string().optional(),
  
  // Enrollment information
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  academicSessionId: z.string().optional(),
});

const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().optional(),
  rollNumber: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianRelation: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalInfo: z.string().optional(),
});

const toggleStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']),
});

// All routes require authentication
router.use(authenticate);

// Routes accessible by superadmin, admin, and teacher (read-only for teacher)
router.get(
  '/',
  authorize('superadmin', 'admin', 'teacher'),
  studentsController.getAllStudents.bind(studentsController)
);

router.get(
  '/stats',
  authorize('superadmin', 'admin'),
  studentsController.getStudentStats.bind(studentsController)
);

router.get(
  '/:id',
  authorize('superadmin', 'admin', 'teacher'),
  studentsController.getStudentById.bind(studentsController)
);

// Routes accessible only by superadmin and admin
router.post(
  '/',
  authorize('superadmin', 'admin'),
  validateBody(createStudentSchema),
  studentsController.createStudent.bind(studentsController)
);

router.put(
  '/:id',
  authorize('superadmin', 'admin'),
  validateBody(updateStudentSchema),
  studentsController.updateStudent.bind(studentsController)
);

router.patch(
  '/:id/status',
  authorize('superadmin', 'admin'),
  validateBody(toggleStatusSchema),
  studentsController.toggleStudentStatus.bind(studentsController)
);

export default router;