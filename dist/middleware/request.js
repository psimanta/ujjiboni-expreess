"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("../config"));
const requestMiddleware = (app) => {
    app.use(express_1.default.json({
        limit: '10mb',
        strict: true,
    }));
    app.use(express_1.default.urlencoded({
        extended: true,
        limit: '10mb',
        parameterLimit: 1000,
    }));
    app.use((req, res, next) => {
        if (config_1.default.nodeEnv === 'development') {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
        }
        next();
    });
};
exports.default = requestMiddleware;
//# sourceMappingURL=request.js.map