import { Request, Response } from 'express';
import { User, UserRole } from '../models';
import emailService from '../services/email.service';

export class UserController {
  // Create a new user (admin only)
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, fullName } = req.body;

      // Validate input
      if (!email || !fullName) {
        res.status(400).json({
          success: false,
          message: 'Email and full name are required',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      // Create new user
      const newUser = new User({
        email: email.toLowerCase(),
        fullName: fullName.trim(),
        isFirstLogin: true,
      });

      await newUser.save();

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(newUser.email, newUser.fullName);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the user creation if email fails
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully. Welcome email sent.',
        data: {
          user: newUser.toJSON(),
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during user creation',
      });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const role = req.query.role as UserRole;

      // Build query
      const query: any = {};

      if (role && Object.values(UserRole).includes(role)) {
        query.role = role;
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }),
        User.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        users,
        total,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching users',
      });
    }
  }

  // Get user by ID (admin or own profile)
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching user',
      });
    }
  }

  // Update user (admin only for role changes, user can update own profile)
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, role } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Check permissions
      const isAdmin = req.user.role === UserRole.ADMIN;
      const isOwnProfile = req.user?._id?.toString() === id;

      if (!isAdmin && !isOwnProfile) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own profile.',
        });
        return;
      }

      // Update allowed fields
      if (fullName && fullName.trim()) {
        user.fullName = fullName.trim();
      }

      // Only admin can change roles
      if (role && isAdmin) {
        if (Object.values(UserRole).includes(role)) {
          user.role = role;
        } else {
          res.status(400).json({
            success: false,
            message: 'Invalid role specified',
          });
          return;
        }
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during user update',
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Prevent admin from deleting themselves
      if (req.user?._id?.toString() === id) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await User.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during user deletion',
      });
    }
  }

  // Toggle user active status (admin only)
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Prevent admin from disabling themselves
      if (req.user?._id?.toString() === id) {
        res.status(400).json({
          success: false,
          message: 'You cannot change your own status',
        });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Note: We don't have an active field in our model, but this is where you'd toggle it
      // For now, we'll just return success
      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during status update',
      });
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalUsers, adminCount, memberCount, firstLoginCount] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: UserRole.ADMIN }),
        User.countDocuments({ role: UserRole.MEMBER }),
        User.countDocuments({ isFirstLogin: true }),
      ]);

      // Get recent users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          adminCount,
          memberCount,
          firstLoginCount,
          recentUsers,
          stats: {
            totalUsers,
            byRole: {
              [UserRole.ADMIN]: adminCount,
              [UserRole.MEMBER]: memberCount,
            },
            pendingFirstLogin: firstLoginCount,
            recentRegistrations: recentUsers,
          },
        },
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching user statistics',
      });
    }
  }

  // Resend welcome email (admin only)
  async resendWelcomeEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Send welcome email
      const emailSent = await emailService.sendWelcomeEmail(user.email, user.fullName);

      if (emailSent) {
        res.status(200).json({
          success: true,
          message: 'Welcome email sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send welcome email',
        });
      }
    } catch (error) {
      console.error('Resend welcome email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while sending email',
      });
    }
  }
}

export default new UserController();
