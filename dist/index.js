"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const database_1 = __importDefault(require("./database"));
const middleware_1 = require("./middleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
(0, middleware_1.securityMiddleware)(app);
(0, middleware_1.requestMiddleware)(app);
app.use('/', routes_1.default);
app.use('*', middleware_1.notFoundMiddleware);
app.use(middleware_1.errorMiddleware);
const startServer = async () => {
    try {
        const database = database_1.default.getInstance();
        await database.connect();
        app.listen(config_1.default.port, () => {
            console.log(`🚀 Server is running on port ${config_1.default.port}`);
            console.log(`📍 Environment: ${config_1.default.nodeEnv}`);
            console.log(`🌐 URL: http://localhost:${config_1.default.port}`);
            console.log(`📋 App: ${config_1.default.app.name} v${config_1.default.api.version}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        const database = database_1.default.getInstance();
        await database.disconnect();
        console.log('👋 Server shutdown complete');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    try {
        const database = database_1.default.getInstance();
        await database.disconnect();
        console.log('👋 Server shutdown complete');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map