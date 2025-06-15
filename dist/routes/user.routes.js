"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', [auth_middleware_1.authenticate, auth_middleware_1.requireAdmin], user_controller_1.default.createUser);
router.get('/', [auth_middleware_1.authenticate], user_controller_1.default.getUsers);
router.get('/stats', [auth_middleware_1.authenticate], user_controller_1.default.getUserStats);
router.get('/:id', [auth_middleware_1.authenticate], user_controller_1.default.getUserById);
router.put('/:id', [auth_middleware_1.authenticate, auth_middleware_1.requireAdmin], user_controller_1.default.updateUser);
router.delete('/:id', [auth_middleware_1.authenticate, auth_middleware_1.requireAdmin], user_controller_1.default.deleteUser);
router.post('/:id/toggle-status', [auth_middleware_1.authenticate, auth_middleware_1.requireAdmin], user_controller_1.default.toggleUserStatus);
router.post('/:id/resend-welcome', [auth_middleware_1.authenticate, auth_middleware_1.requireAdmin], user_controller_1.default.resendWelcomeEmail);
exports.default = router;
//# sourceMappingURL=user.routes.js.map