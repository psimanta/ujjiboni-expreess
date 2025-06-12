import { Request, Response } from 'express';
export declare const generateInterestPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordInterestPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLoanInterestPayments: (req: Request, res: Response) => Promise<void>;
export declare const getMemberInterestPayments: (req: Request, res: Response) => Promise<void>;
export declare const getOverdueInterestPayments: (req: Request, res: Response) => Promise<void>;
export declare const getPendingInterestPayments: (req: Request, res: Response) => Promise<void>;
export declare const getInterestPaymentSummary: (req: Request, res: Response) => Promise<void>;
export declare const getInterestPaymentById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInterestPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=interestPayment.controller.d.ts.map