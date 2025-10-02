import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { validateBody } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const usersController = new UsersController();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['student', 'teacher', 'guardian', 'admin', 'superadmin', 'accountant', 'hostel_manager']),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().optional(),
  isActive: z.boolean().optional(),
});

// All routes require authentication
router.use(authenticate);

// Routes accessible only by superadmin and admin
router.get(
  '/',
  authorize('superadmin', 'admin'),
  usersController.getAllUsers.bind(usersController)
);

router.get(
  '/stats',
  authorize('superadmin', 'admin'),
  usersController.getUserStats.bind(usersController)
);

router.post(
  '/',
  authorize('superadmin', 'admin'),
  validateBody(createUserSchema),
  usersController.createUser.bind(usersController)
);

router.get(
  '/:id',
  authorize('superadmin', 'admin'),
  usersController.getUserById.bind(usersController)
);

router.put(
  '/:id',
  authorize('superadmin', 'admin'),
  validateBody(updateUserSchema),
  usersController.updateUser.bind(usersController)
);

router.delete(
  '/:id',
  authorize('superadmin', 'admin'),
  usersController.deleteUser.bind(usersController)
);

export default router;