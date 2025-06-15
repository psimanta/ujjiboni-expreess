"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const models_1 = require("../models");
const email_service_1 = __importDefault(require("../services/email.service"));
class UserController {
    async createUser(req, res) {
        try {
            const { email, fullName } = req.body;
            if (!email || !fullName) {
                res.status(400).json({
                    success: false,
                    message: 'Email and full name are required',
                });
                return;
            }
            const existingUser = await models_1.User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'User with this email already exists',
                });
                return;
            }
            const newUser = new models_1.User({
                email: email.toLowerCase(),
                fullName: fullName.trim(),
                isFirstLogin: true,
            });
            await newUser.save();
            try {
                await email_service_1.default.sendWelcomeEmail(newUser.email, newUser.fullName);
            }
            catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }
            res.status(201).json({
                success: true,
                message: 'User created successfully. Welcome email sent.',
                data: {
                    user: newUser.toJSON(),
                },
            });
        }
        catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during user creation',
            });
        }
    }
    async getUsers(req, res) {
        try {
            const role = req.query.role;
            const query = {};
            if (role && Object.values(models_1.UserRole).includes(role)) {
                query.role = role;
            }
            const [users, total] = await Promise.all([
                models_1.User.find(query).sort({ createdAt: -1 }),
                models_1.User.countDocuments(query),
            ]);
            res.status(200).json({
                success: true,
                message: 'Users fetched successfully',
                users,
                total,
            });
        }
        catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching users',
            });
        }
    }
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await models_1.User.findById(id);
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
        }
        catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user',
            });
        }
    }
    async updateUser(req, res) {
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
            const user = await models_1.User.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            const isAdmin = req.user.role === models_1.UserRole.ADMIN;
            const isOwnProfile = req.user?._id?.toString() === id;
            if (!isAdmin && !isOwnProfile) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update your own profile.',
                });
                return;
            }
            if (fullName && fullName.trim()) {
                user.fullName = fullName.trim();
            }
            if (role && isAdmin) {
                if (Object.values(models_1.UserRole).includes(role)) {
                    user.role = role;
                }
                else {
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
        }
        catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during user update',
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            if (req.user?._id?.toString() === id) {
                res.status(400).json({
                    success: false,
                    message: 'You cannot delete your own account',
                });
                return;
            }
            const user = await models_1.User.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            await models_1.User.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during user deletion',
            });
        }
    }
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            if (req.user?._id?.toString() === id) {
                res.status(400).json({
                    success: false,
                    message: 'You cannot change your own status',
                });
                return;
            }
            const user = await models_1.User.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'User status updated successfully',
                data: {
                    user: user.toJSON(),
                },
            });
        }
        catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during status update',
            });
        }
    }
    async getUserStats(req, res) {
        try {
            const [totalUsers, adminCount, memberCount, firstLoginCount] = await Promise.all([
                models_1.User.countDocuments(),
                models_1.User.countDocuments({ role: models_1.UserRole.ADMIN }),
                models_1.User.countDocuments({ role: models_1.UserRole.MEMBER }),
                models_1.User.countDocuments({ isFirstLogin: true }),
            ]);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentUsers = await models_1.User.countDocuments({
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
                            [models_1.UserRole.ADMIN]: adminCount,
                            [models_1.UserRole.MEMBER]: memberCount,
                        },
                        pendingFirstLogin: firstLoginCount,
                        recentRegistrations: recentUsers,
                    },
                },
            });
        }
        catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user statistics',
            });
        }
    }
    async resendWelcomeEmail(req, res) {
        try {
            const { id } = req.params;
            const user = await models_1.User.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            const emailSent = await email_service_1.default.sendWelcomeEmail(user.email, user.fullName);
            if (emailSent) {
                res.status(200).json({
                    success: true,
                    message: 'Welcome email sent successfully',
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to send welcome email',
                });
            }
        }
        catch (error) {
            console.error('Resend welcome email error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while sending email',
            });
        }
    }
}
exports.UserController = UserController;
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map