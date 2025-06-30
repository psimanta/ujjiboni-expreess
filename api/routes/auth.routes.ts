import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/login', authController.login);
// router.post('/setup-password', authController.setupPassword); // Legacy endpoint
router.post('/setup-password-with-otp', authController.setupPasswordWithOTP); // OTP verification from welcome email
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes (authentication required)
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, authController.changePassword);

// Verify token endpoint
router.get('/verify-token', authenticate, authController.checkAuthentication);

export default router;
