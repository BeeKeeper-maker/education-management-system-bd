import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getUserAnnouncements,
  getAnnouncementStats,
} from '../controllers/announcements.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get announcement statistics
router.get('/stats', authorize(['superadmin', 'admin']), getAnnouncementStats);

// Get announcements for a specific user
router.get('/user/:userId', getUserAnnouncements);

// CRUD operations
router.post('/', authorize(['superadmin', 'admin']), createAnnouncement);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.put('/:id', authorize(['superadmin', 'admin']), updateAnnouncement);
router.delete('/:id', authorize(['superadmin', 'admin']), deleteAnnouncement);

export default router;