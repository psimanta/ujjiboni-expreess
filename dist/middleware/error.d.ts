import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
declare const errorMiddleware: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
export default errorMiddleware;
//# sourceMappingURL=error.d.ts.map