"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const email_service_1 = __importDefault(require("../services/email.service"));
const config_1 = __importDefault(require("../config"));
const generateToken = (user) => {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, { expiresIn: '1h' });
};
class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required',
                });
                return;
            }
            const user = await models_1.User.findOne({ email: email.toLowerCase() }).select('+password');
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
                return;
            }
            if (!user.password) {
                res.status(400).json({
                    success: false,
                    message: 'First-time login detected. Please set your password.',
                    requiresPasswordSetup: true,
                    userId: user._id,
                });
                return;
            }
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
                return;
            }
            await user.markLogin();
            const token = generateToken(user);
            const userResponse = user.toJSON();
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: userResponse,
                token,
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login',
            });
        }
    }
    async setupPassword(req, res) {
        try {
            const { userId, password, confirmPassword } = req.body;
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
            const user = await models_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            if (!user.isFirstLogin) {
                res.status(400).json({
                    success: false,
                    message: 'Password has already been set for this user',
                });
                return;
            }
            await user.setPassword(password);
            const token = generateToken(user);
            const userResponse = user.toJSON();
            res.status(200).json({
                success: true,
                message: 'Password set successfully',
                data: {
                    user: userResponse,
                    token,
                },
            });
        }
        catch (error) {
            console.error('Setup password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password setup',
            });
        }
    }
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({
                    success: false,
                    message: 'Email is required',
                });
                return;
            }
            const user = await models_1.User.findOne({ email: email.toLowerCase() });
            res.status(200).json({
                success: true,
                message: 'If the email exists, a password reset link has been sent',
            });
            if (!user) {
                return;
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetJWT = jsonwebtoken_1.default.sign({ userId: user._id, resetToken, type: 'password-reset' }, config_1.default.jwt.secret, { expiresIn: '1h' });
            await email_service_1.default.sendPasswordResetEmail(user.email, user.fullName, resetJWT);
        }
        catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password reset request',
            });
        }
    }
    async resetPassword(req, res) {
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
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
                if (decoded.type !== 'password-reset') {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid reset token',
                    });
                    return;
                }
                const user = await models_1.User.findById(decoded.userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found',
                    });
                    return;
                }
                await user.setPassword(password);
                res.status(200).json({
                    success: true,
                    message: 'Password reset successfully',
                });
            }
            catch (_error) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token',
                });
                return;
            }
        }
        catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password reset',
            });
        }
    }
    async getProfile(req, res) {
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
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching profile',
            });
        }
    }
    async changePassword(req, res) {
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
            const user = await models_1.User.findById(req.user._id).select('+password');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            const isValidPassword = await user.comparePassword(currentPassword);
            if (!isValidPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect',
                });
                return;
            }
            await user.setPassword(newPassword);
            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password change',
            });
        }
    }
    async checkAuthentication(req, res) {
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            data: {
                user: req.user,
            },
        });
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map