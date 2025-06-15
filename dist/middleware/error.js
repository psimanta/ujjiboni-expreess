"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const errorMiddleware = (err, req, res, _next) => {
    console.error('Error Stack:', err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.isOperational
        ? err.message
        : config_1.default.nodeEnv === 'development'
            ? err.message
            : 'Something went wrong';
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : 'Error',
        message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        ...(config_1.default.nodeEnv === 'development' && { stack: err.stack }),
    });
};
exports.default = errorMiddleware;
//# sourceMappingURL=error.js.map