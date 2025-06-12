"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMemberOnly = exports.requireMember = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const config_1 = __importDefault(require("../config"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided or invalid format.',
            });
            return;
        }
        const token = authHeader.substring(7);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        const user = await models_1.User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Access denied. User not found.',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Access denied. Token expired.',
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
        });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
        return;
    }
    if (req.user.role !== models_1.UserRole.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.',
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireMember = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
        return;
    }
    if (req.user.role !== models_1.UserRole.MEMBER && req.user.role !== models_1.UserRole.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Access denied. Member privileges required.',
        });
        return;
    }
    next();
};
exports.requireMember = requireMember;
const requireMemberOnly = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
        return;
    }
    if (req.user.role !== models_1.UserRole.MEMBER) {
        res.status(403).json({
            success: false,
            message: 'Access denied. Member-only privileges required.',
        });
        return;
    }
    next();
};
exports.requireMemberOnly = requireMemberOnly;
//# sourceMappingURL=auth.middleware.js.map