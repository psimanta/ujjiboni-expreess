"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/ujjiboni',
        name: process.env.DATABASE_NAME || 'ujjiboni',
        options: {
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
            serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
            socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    api: {
        key: process.env.API_KEY || '',
        version: '1.0.0',
    },
    app: {
        name: 'Ujjiboni',
        description: 'Ujjiboni is an organization.',
    },
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map