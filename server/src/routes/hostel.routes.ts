import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as hostelController from '../controllers/hostel.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Hostel routes
router.get('/hostels', hostelController.getHostels);
router.get('/hostels/statistics', hostelController.getHostelStatistics);
router.get('/hostels/:id', hostelController.getHostelById);
router.post('/hostels', authorize(['superadmin', 'admin', 'hostel_manager']), hostelController.createHostel);
router.put('/hostels/:id', authorize(['superadmin', 'admin', 'hostel_manager']), hostelController.updateHostel);
router.delete('/hostels/:id', authorize(['superadmin', 'admin']), hostelController.deleteHostel);

// Room routes
router.get('/hostels/:hostelId/rooms', hostelController.getRoomsByHostel);
router.post('/rooms', authorize(['superadmin', 'admin', 'hostel_manager']), hostelController.createRoom);
router.put('/rooms/:id', authorize(['superadmin', 'admin', 'hostel_manager']), hostelController.updateRoom);
router.delete('/rooms/:id', authorize(['superadmin', 'admin']), hostelController.deleteRoom);

// Allocation routes
router.get('/allocations', hostelController.getAllocations);
router.post('/allocations', authorize(['superadmin', 'admin', 'hostel_manager']), hostelController.allocateRoom);
router.patch('/allocations/:id/vacate', authorize(['superadmin', 'admin', 'hostel_manager']), hostelController.vacateRoom);
router.get('/students/:studentId/hostel', hostelController.getStudentHostel);

export default router;