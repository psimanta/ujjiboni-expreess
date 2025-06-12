import { Request, Response } from 'express';
export declare const getAllTransactions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTransactionById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTransactionsByAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAccountBalance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTransaction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTransaction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTransaction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=transaction.controller.d.ts.map