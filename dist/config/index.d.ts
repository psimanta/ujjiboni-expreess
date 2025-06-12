export declare const config: {
    port: string | number;
    nodeEnv: string;
    allowedOrigins: string[];
    database: {
        url: string;
        name: string;
        options: {
            maxPoolSize: number;
            serverSelectionTimeoutMS: number;
            socketTimeoutMS: number;
        };
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    api: {
        key: string;
        version: string;
    };
    app: {
        name: string;
        description: string;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map