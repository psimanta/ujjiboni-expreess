"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_controller_1 = __importDefault(require("../controllers/loan.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const interestPayment_controller_1 = require("../controllers/interestPayment.controller");
const router = (0, express_1.Router)();
router.post('/', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], loan_controller_1.default.createLoan);
router.get('/', [auth_middleware_1.authenticate], loan_controller_1.default.getLoans);
router.put('/:id', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], loan_controller_1.default.updateLoan);
router.get('/stats', [auth_middleware_1.authenticate], loan_controller_1.default.getLoanStats);
router.get('/member/stats', [auth_middleware_1.authenticate], loan_controller_1.default.getMemberLoans);
router.get('/:id', [auth_middleware_1.authenticate], loan_controller_1.default.getLoanById);
router.post('/:loan/payments', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], loan_controller_1.default.recordPayment);
router.get('/:loan/payments', [auth_middleware_1.authenticate], loan_controller_1.default.getLoanPayments);
router.post('/:loan/interests', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], interestPayment_controller_1.recordInterestPayment);
router.get('/:loan/interests', [auth_middleware_1.authenticate], interestPayment_controller_1.getLoanInterestPayments);
exports.default = router;
//# sourceMappingURL=loan.routes.js.map