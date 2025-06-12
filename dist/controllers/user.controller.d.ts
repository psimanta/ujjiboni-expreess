import { Request, Response } from 'express';
export declare class UserController {
    createUser(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    toggleUserStatus(req: Request, res: Response): Promise<void>;
    getUserStats(req: Request, res: Response): Promise<void>;
    resendWelcomeEmail(req: Request, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map