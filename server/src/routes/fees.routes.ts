import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getFeeCategories,
  createFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  assignFeeToStudent,
  collectFeePayment,
  getStudentFees,
  getPaymentHistory,
  getFeeCollectionReport,
} from '../controllers/fees.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get fee categories (All authenticated users)
router.get('/categories', getFeeCategories);

// Create fee structure (Admin, SuperAdmin)
router.post(
  '/structures',
  authorize(['admin', 'superadmin']),
  createFeeStructure
);

// Get fee structures (Admin, SuperAdmin, Accountant)
router.get(
  '/structures',
  authorize(['admin', 'superadmin', 'accountant']),
  getFeeStructures
);

// Get fee structure by ID (Admin, SuperAdmin, Accountant)
router.get(
  '/structures/:id',
  authorize(['admin', 'superadmin', 'accountant']),
  getFeeStructureById
);

// Assign fee to student (Admin, SuperAdmin)
router.post(
  '/assign',
  authorize(['admin', 'superadmin']),
  assignFeeToStudent
);

// Collect fee payment (Admin, SuperAdmin, Accountant)
router.post(
  '/payments',
  authorize(['admin', 'superadmin', 'accountant']),
  collectFeePayment
);

// Get student fees (All authenticated users can view their own)
router.get('/student/:studentId', getStudentFees);

// Get payment history (All authenticated users can view their own)
router.get('/payments/:studentId', getPaymentHistory);

// Get fee collection report (Admin, SuperAdmin, Accountant)
router.get(
  '/reports/collection',
  authorize(['admin', 'superadmin', 'accountant']),
  getFeeCollectionReport
);

export default router;