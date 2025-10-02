import { Router } from 'express';
import {
  sendSingleSms,
  sendBulkSmsHandler,
  getSmsLogs,
  getSmsStats,
} from '../controllers/sms.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send SMS (admin only)
router.post('/send', authorize(['superadmin', 'admin']), sendSingleSms);
router.post('/send-bulk', authorize(['superadmin', 'admin']), sendBulkSmsHandler);

// Get SMS logs and stats (admin only)
router.get('/logs', authorize(['superadmin', 'admin']), getSmsLogs);
router.get('/stats', authorize(['superadmin', 'admin']), getSmsStats);

export default router;