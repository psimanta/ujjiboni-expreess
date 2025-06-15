"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.get('/', [auth_middleware_1.authenticate], controllers_1.getAllTransactions);
router.get('/:id', [auth_middleware_1.authenticate], controllers_1.getTransactionById);
router.get('/account/:accountId', [auth_middleware_1.authenticate], controllers_1.getTransactionsByAccount);
router.get('/account/:accountId/balance', [auth_middleware_1.authenticate], controllers_1.getAccountBalance);
router.post('/', [auth_middleware_1.authenticate], controllers_1.createTransaction);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map