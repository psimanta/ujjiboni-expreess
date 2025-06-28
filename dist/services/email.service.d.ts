export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendWelcomeEmail(userEmail: string, fullName: string, otpCode?: string): Promise<boolean>;
    sendPasswordResetEmail(userEmail: string, fullName: string, resetToken: string): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=email.service.d.ts.map