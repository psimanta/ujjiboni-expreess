"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', controllers_1.getAllAccounts);
router.get('/:id', controllers_1.getAccountById);
router.post('/', [auth_middleware_1.requireAdmin], controllers_1.createAccount);
exports.default = router;
//# sourceMappingURL=account.js.map