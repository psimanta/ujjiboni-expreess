import nodemailer from 'nodemailer';
import config from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"${config.app.name}" <noreply@ujjiboni.com>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, fullName: string, otpCode?: string): Promise<boolean> {
    const subject = `Welcome to ${config.app.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${config.app.name}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${config.app.name}</h1>
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
          
          ${
            otpCode
              ? `
          <div style="background: white; border: 2px solid #667eea; padding: 30px; margin: 30px 0; border-radius: 10px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 18px;">Your One-Time Password (OTP):</h3>
            <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 15px 0;">
              ${otpCode}
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Use this OTP to set your password during first login</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> This OTP will expire in 15 minutes. Use it to set your password during first login.
            </p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>🔒 Security Tip:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
            </p>
          </div>
          `
              : `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> You will need to set your password during your first login.
            </p>
          </div>
          `
          }
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-password" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
          <p>If you have any questions, please contact your administrator.</p>
          <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ${config.app.name}, ${fullName}!
      
      Your account has been created successfully. You can now log in to access the financial management system.
      
      Login Details:
      Email: ${userEmail}
      Status: First-time login required
      
      ${
        otpCode
          ? `
      Your One-Time Password (OTP): ${otpCode}
      
      Important: This OTP will expire in 15 minutes. Use it to set your password during first login.
      
      Security Tip: Never share this OTP with anyone. Our team will never ask for your OTP.
      `
          : `Important: You will need to set your password during your first login.`
      }
      
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

  async sendPasswordResetEmail(
    userEmail: string,
    fullName: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${config.app.name}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${config.app.name}</h1>
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
          <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset - ${config.app.name}
      
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

export default new EmailService();
