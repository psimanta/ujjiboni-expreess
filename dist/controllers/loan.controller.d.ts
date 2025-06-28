import { Request, Response } from 'express';
export declare class LoanController {
    createLoan(req: Request, res: Response): Promise<void>;
    getLoans(req: Request, res: Response): Promise<void>;
    getLoanById(req: Request, res: Response): Promise<void>;
    updateLoan(req: Request, res: Response): Promise<void>;
    recordPayment(req: Request, res: Response): Promise<void>;
    getLoanPayments(req: Request, res: Response): Promise<void>;
    getMemberLoans(req: Request, res: Response): Promise<void>;
    getLoanStats(req: Request, res: Response): Promise<void>;
}
declare const _default: LoanController;
export default _default;
//# sourceMappingURL=loan.controller.d.ts.map