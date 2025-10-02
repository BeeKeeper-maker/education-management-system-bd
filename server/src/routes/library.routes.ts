import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as libraryController from '../controllers/library.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Book routes
router.get('/books', libraryController.getBooks);
router.get('/books/categories', libraryController.getBookCategories);
router.get('/books/statistics', libraryController.getLibraryStatistics);
router.get('/books/:id', libraryController.getBookById);
router.post('/books', authorize(['superadmin', 'admin']), libraryController.createBook);
router.put('/books/:id', authorize(['superadmin', 'admin']), libraryController.updateBook);
router.delete('/books/:id', authorize(['superadmin', 'admin']), libraryController.deleteBook);

// Issue/Return routes
router.get('/issues', libraryController.getBookIssues);
router.post('/issues', authorize(['superadmin', 'admin']), libraryController.issueBook);
router.patch('/issues/:id/return', authorize(['superadmin', 'admin']), libraryController.returnBook);
router.get('/students/:studentId/books', libraryController.getStudentBooks);

// Maintenance routes
router.post('/maintenance/update-overdue', authorize(['superadmin', 'admin']), libraryController.updateOverdueStatus);

export default router;