import { Router } from 'express';
import { AcademicController } from '../controllers/academic.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const academicController = new AcademicController();

// All routes require authentication
router.use(authenticate);

// Classes routes
router.get('/classes', academicController.getAllClasses.bind(academicController));
router.get('/classes/:classId/sections', academicController.getSectionsByClass.bind(academicController));

// Sections routes
router.get('/sections', academicController.getAllSections.bind(academicController));

// Subjects routes
router.get('/subjects', academicController.getAllSubjects.bind(academicController));

// Academic sessions routes
router.get('/sessions', academicController.getAllSessions.bind(academicController));
router.get('/sessions/current', academicController.getCurrentSession.bind(academicController));

export default router;