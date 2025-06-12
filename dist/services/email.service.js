"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.SMTP_FROM || `"${config_1.default.app.name}" <noreply@ujjiboni.com>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
    async sendWelcomeEmail(userEmail, fullName) {
        const subject = `Welcome to ${config_1.default.app.name}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${config_1.default.app.name}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${config_1.default.app.name}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Financial Management System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Welcome, ${fullName}!</h2>
          <p>Your account has been created successfully. You can now log in to access the financial management system.</p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #2c3e50;">Your Login Details:</h3>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Status:</strong> First-time login required</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> You will need to set your password during your first login.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
          <p>If you have any questions, please contact your administrator.</p>
          <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${config_1.default.app.name}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `
      Welcome to ${config_1.default.app.name}, ${fullName}!
      
      Your account has been created successfully. You can now log in to access the financial management system.
      
      Login Details:
      Email: ${userEmail}
      Status: First-time login required
      
      Important: You will need to set your password during your first login.
      
      Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
      
      If you have any questions, please contact your administrator.
    `;
        return this.sendEmail({
            to: userEmail,
            subject,
            html,
            text,
        });
    }
    async sendPasswordResetEmail(userEmail, fullName, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const subject = 'Password Reset Request';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${config_1.default.app.name}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${config_1.default.app.name}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Hello, ${fullName}!</h2>
          <p>You have requested to reset your password. Click the button below to set a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${config_1.default.app.name}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `
      Password Reset - ${config_1.default.app.name}
      
      Hello, ${fullName}!
      
      You have requested to reset your password. Use the link below to set a new password:
      
      ${resetUrl}
      
      Security Notice: This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    `;
        return this.sendEmail({
            to: userEmail,
            subject,
            html,
            text,
        });
    }
}
exports.default = new EmailService();
//# sourceMappingURL=email.service.js.map