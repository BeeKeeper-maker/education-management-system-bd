import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getExpenseCategories,
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStatistics,
  getFinancialSummary,
} from '../controllers/expenses.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get expense categories (Admin, SuperAdmin, Accountant)
router.get(
  '/categories',
  authorize(['admin', 'superadmin', 'accountant']),
  getExpenseCategories
);

// Create expense (Admin, SuperAdmin, Accountant)
router.post(
  '/',
  authorize(['admin', 'superadmin', 'accountant']),
  createExpense
);

// Get all expenses (Admin, SuperAdmin, Accountant)
router.get(
  '/',
  authorize(['admin', 'superadmin', 'accountant']),
  getExpenses
);

// Get expense by ID (Admin, SuperAdmin, Accountant)
router.get(
  '/:id',
  authorize(['admin', 'superadmin', 'accountant']),
  getExpenseById
);

// Update expense (Admin, SuperAdmin, Accountant)
router.put(
  '/:id',
  authorize(['admin', 'superadmin', 'accountant']),
  updateExpense
);

// Delete expense (Admin, SuperAdmin)
router.delete(
  '/:id',
  authorize(['admin', 'superadmin']),
  deleteExpense
);

// Get expense statistics (Admin, SuperAdmin, Accountant)
router.get(
  '/reports/statistics',
  authorize(['admin', 'superadmin', 'accountant']),
  getExpenseStatistics
);

// Get financial summary (Admin, SuperAdmin, Accountant)
router.get(
  '/reports/summary',
  authorize(['admin', 'superadmin', 'accountant']),
  getFinancialSummary
);

export default router;