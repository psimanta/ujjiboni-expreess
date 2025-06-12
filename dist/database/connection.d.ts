import mongoose from 'mongoose';
declare class Database {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): Database;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
    getConnection(): mongoose.Connection;
}
export default Database;
//# sourceMappingURL=connection.d.ts.map