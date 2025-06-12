"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', controllers_1.getAllTransactions);
router.get('/:id', controllers_1.getTransactionById);
router.get('/account/:accountId', controllers_1.getTransactionsByAccount);
router.get('/account/:accountId/balance', controllers_1.getAccountBalance);
router.post('/', controllers_1.createTransaction);
router.put('/:id', controllers_1.updateTransaction);
router.delete('/:id', controllers_1.deleteTransaction);
exports.default = router;
//# sourceMappingURL=transaction.js.map