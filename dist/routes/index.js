"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
const database_1 = __importDefault(require("../database"));
const account_routes_1 = __importDefault(require("./account.routes"));
const transaction_routes_1 = __importDefault(require("./transaction.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const loan_routes_1 = __importDefault(require("./loan.routes"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.json({
        message: `Welcome to ${config_1.default.app.name}!`,
        description: config_1.default.app.description,
        version: config_1.default.api.version,
        environment: config_1.default.nodeEnv,
        timestamp: new Date().toISOString(),
    });
});
router.get('/health', (req, res) => {
    const database = database_1.default.getInstance();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: config_1.default.nodeEnv,
        version: config_1.default.api.version,
        database: {
            connected: database.getConnectionStatus(),
            readyState: database.getConnection().readyState,
            host: database.getConnection().host,
            name: database.getConnection().name,
        },
    });
});
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/loans', loan_routes_1.default);
router.use('/accounts', account_routes_1.default);
router.use('/transactions', transaction_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map