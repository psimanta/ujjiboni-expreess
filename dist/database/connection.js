"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
class Database {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            console.log('📊 Database already connected');
            return;
        }
        try {
            const connectionOptions = {
                dbName: config_1.default.database.name,
            };
            await mongoose_1.default.connect(config_1.default.database.url, connectionOptions);
            this.isConnected = true;
            console.log('📊 Connected to MongoDB successfully');
            mongoose_1.default.connection.on('error', error => {
                console.error('❌ Database connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('📊 Database disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('📊 Database reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to database:', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('📊 Database disconnected successfully');
        }
        catch (error) {
            console.error('❌ Error disconnecting from database:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    getConnection() {
        return mongoose_1.default.connection;
    }
}
exports.default = Database;
//# sourceMappingURL=connection.js.map