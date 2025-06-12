import { Request, Response } from 'express';
export declare const getAllAccounts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAccountById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const lockAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unlockAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=account.controller.d.ts.map