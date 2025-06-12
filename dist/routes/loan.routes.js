"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_controller_1 = __importDefault(require("../controllers/loan.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], loan_controller_1.default.createLoan);
router.get('/', [auth_middleware_1.authenticate], loan_controller_1.default.getLoans);
router.get('/stats', [auth_middleware_1.authenticate], loan_controller_1.default.getLoanStats);
router.put('/:id', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], loan_controller_1.default.updateLoan);
router.get('/member/:memberId?', [auth_middleware_1.authenticate], loan_controller_1.default.getMemberLoans);
router.get('/:id', [auth_middleware_1.authenticate], loan_controller_1.default.getLoanById);
router.post('/:loanId/payments', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], loan_controller_1.default.recordPayment);
router.get('/:loanId/payments', [auth_middleware_1.authenticate], loan_controller_1.default.getLoanPayments);
exports.default = router;
//# sourceMappingURL=loan.routes.js.map