"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const securityMiddleware = (app) => {
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: process.env.NODE_ENV === 'production' ? 'https://ujjiboni-app.vercel.app' : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
};
exports.default = securityMiddleware;
//# sourceMappingURL=security.js.map