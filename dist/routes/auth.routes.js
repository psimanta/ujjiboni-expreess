"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.default.login);
router.post('/setup-password', auth_controller_1.default.setupPassword);
router.post('/request-password-reset', auth_controller_1.default.requestPasswordReset);
router.post('/reset-password', auth_controller_1.default.resetPassword);
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.default.getProfile);
router.post('/change-password', auth_middleware_1.authenticate, auth_controller_1.default.changePassword);
router.get('/verify-token', auth_middleware_1.authenticate, auth_controller_1.default.checkAuthentication);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map