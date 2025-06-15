"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.get('/', [auth_middleware_1.authenticate], controllers_1.getAllAccounts);
router.get('/:id', [auth_middleware_1.authenticate], controllers_1.getAccountById);
router.post('/', [auth_middleware_1.authenticate, auth_middleware_1.requireMemberOnly], controllers_1.createAccount);
exports.default = router;
//# sourceMappingURL=account.routes.js.map