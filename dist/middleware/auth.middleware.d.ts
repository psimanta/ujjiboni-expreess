import { Request, Response, NextFunction } from 'express';
import { UserRole, type IUser } from '../models';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireMember: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireMemberOnly: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map