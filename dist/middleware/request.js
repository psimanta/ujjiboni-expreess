"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("../config"));
const morgan_1 = __importDefault(require("morgan"));
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
    if (config_1.default.nodeEnv === 'development') {
        app.use((0, morgan_1.default)('dev'));
    }
};
exports.default = requestMiddleware;
//# sourceMappingURL=request.js.map