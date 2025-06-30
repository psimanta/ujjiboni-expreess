import mongoose from 'mongoose';
import config from '../config';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📊 Database already connected');
      return;
    }

    try {
      const connectionOptions = {
        dbName: config.database.name,
      };

      await mongoose.connect(config.database.url, connectionOptions);

      this.isConnected = true;
      console.log('📊 Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', error => {
        console.error('❌ Database connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📊 Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('📊 Database reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📊 Database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getConnection() {
    return mongoose.connection;
  }
}

export default Database;
