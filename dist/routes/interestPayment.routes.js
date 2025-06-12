"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const interestPayment_controller_1 = require("../controllers/interestPayment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/generate/:loanId', interestPayment_controller_1.generateInterestPayment);
router.post('/record/:interestPaymentId', interestPayment_controller_1.recordInterestPayment);
router.get('/loan/:loanId', interestPayment_controller_1.getLoanInterestPayments);
router.get('/member/:memberId', interestPayment_controller_1.getMemberInterestPayments);
router.get('/overdue', interestPayment_controller_1.getOverdueInterestPayments);
router.get('/pending', interestPayment_controller_1.getPendingInterestPayments);
router.get('/summary', interestPayment_controller_1.getInterestPaymentSummary);
router.get('/:interestPaymentId', interestPayment_controller_1.getInterestPaymentById);
router.put('/:interestPaymentId', interestPayment_controller_1.updateInterestPayment);
exports.default = router;
//# sourceMappingURL=interestPayment.routes.js.map