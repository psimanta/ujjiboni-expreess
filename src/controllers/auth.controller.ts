import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole, type IUser } from '../models';
import emailService from '../services/email.service';
import config from '../config';

// Simple token generation for now - we'll fix the auth middleware later
const generateToken = (user: IUser): string => {
  const payload = {
    userId: (user._id as string).toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret as jwt.Secret);
};

export class AuthController {
  // Login endpoint
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      // Find user with password field included
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Check if user has a password set (not first-time login)
      if (!user.password) {
        res.status(400).json({
          success: false,
          message: 'First-time login detected. Please set your password.',
          requiresPasswordSetup: true,
          userId: user._id,
        });
        return;
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Update last login
      await user.markLogin();

      // Generate token
      const token = generateToken(user);

      // Remove password from response
      const userResponse = user.toJSON();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
      });
    }
  }

  // First-time password setup
  async setupPassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId, password, confirmPassword } = req.body;

      // Validate input
      if (!userId || !password || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'User ID, password, and confirm password are required',
        });
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
        return;
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Check if user is indeed a first-time user
      if (!user.isFirstLogin) {
        res.status(400).json({
          success: false,
          message: 'Password has already been set for this user',
        });
        return;
      }

      // Set password
      await user.setPassword(password);

      // Generate token
      const token = generateToken(user);

      // Remove password from response
      const userResponse = user.toJSON();

      res.status(200).json({
        success: true,
        message: 'Password set successfully',
        data: {
          user: userResponse,
          token,
        },
      });
    } catch (error) {
      console.error('Setup password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password setup',
      });
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });

      if (!user) {
        return; // User doesn't exist, but we still return success
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // In a real application, you'd store this token in the database with expiration
      // For now, we'll create a JWT with short expiration
      const resetJWT = jwt.sign(
        { userId: user._id, resetToken, type: 'password-reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, user.fullName, resetJWT);
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset request',
      });
    }
  }

  // Reset password with token
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token || !password || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Token, password, and confirm password are required',
        });
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
        return;
      }

      // Verify reset token
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;

        if (decoded.type !== 'password-reset') {
          res.status(400).json({
            success: false,
            message: 'Invalid reset token',
          });
          return;
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        // Update password
        await user.setPassword(password);

        res.status(200).json({
          success: true,
          message: 'Password reset successfully',
        });
      } catch (jwtError) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
        return;
      }
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset',
      });
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile fetched successfully',
        user: req.user.toJSON(),
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile',
      });
    }
  }

  // Change password (for authenticated users)
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password, new password, and confirm password are required',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'New passwords do not match',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
        return;
      }

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      // Update password
      await user.setPassword(newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password change',
      });
    }
  }

  // Create an controller to check if the user is authenticated
  async checkAuthentication(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'User is authenticated',
      data: {
        user: req.user,
      },
    });
  }
}

export default new AuthController();
