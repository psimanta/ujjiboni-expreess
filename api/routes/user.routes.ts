import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and most require admin role

// Admin-only routes
router.post('/', [authenticate, requireAdmin], userController.createUser); // Create user
router.get('/', [authenticate], userController.getUsers);
router.get('/stats', [authenticate], userController.getUserStats); // Get user statistics

// Routes that allow admin or own profile access (permission check is inside controller)
router.get('/:id', [authenticate], userController.getUserById); // Get user by ID
router.put('/:id', [authenticate, requireAdmin], userController.updateUser); // Update user

// Admin-only routes
router.delete('/:id', [authenticate, requireAdmin], userController.deleteUser); // Delete user
router.post('/:id/toggle-status', [authenticate, requireAdmin], userController.toggleUserStatus); // Toggle user status
router.post('/:id/resend-welcome', [authenticate, requireAdmin], userController.resendWelcomeEmail); // Resend welcome email

export default router;
