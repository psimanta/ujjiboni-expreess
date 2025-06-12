# Authentication System Setup Guide

## Overview

This authentication system provides a complete login solution for organizational financial management with the following features:

- **Admin-only user creation** - Only admins can add new users/members
- **Email notifications** - Welcome emails sent to new users
- **First-time password setup** - Users must set password on first login
- **Role-based access control** - Admin and Member roles
- **JWT token authentication** - Secure token-based authentication
- **Password reset functionality** - Email-based password reset

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/ujjiboni
DATABASE_NAME=ujjiboni
DB_MAX_POOL_SIZE=10
DB_SERVER_SELECTION_TIMEOUT=5000
DB_SOCKET_TIMEOUT=45000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Ujjiboni Express" <noreply@ujjiboni.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# API Configuration
API_KEY=your-api-key-if-needed
```

## Email Setup

### Gmail Configuration

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `SMTP_PASS`

### Other Email Providers

Update the SMTP settings according to your email provider:

- **Outlook**: `smtp-mail.outlook.com`, port 587
- **Yahoo**: `smtp.mail.yahoo.com`, port 587
- **Custom SMTP**: Use your provider's settings

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Public Routes (No Authentication Required)

**POST /api/auth/login**

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**POST /api/auth/setup-password** (First-time login)

```json
{
  "userId": "user_id_from_login_response",
  "password": "newpassword",
  "confirmPassword": "newpassword"
}
```

**POST /api/auth/request-password-reset**

```json
{
  "email": "user@example.com"
}
```

**POST /api/auth/reset-password**

```json
{
  "token": "reset_token_from_email",
  "password": "newpassword",
  "confirmPassword": "newpassword"
}
```

#### Protected Routes (Authentication Required)

**GET /api/auth/profile**

- Headers: `Authorization: Bearer <jwt_token>`

**POST /api/auth/change-password**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

### User Management Routes (`/api/users`)

All routes require authentication. Admin-only routes are marked.

#### Admin-Only Routes

**POST /api/users** (Create User)

```json
{
  "email": "newuser@example.com",
  "fullName": "New User Name",
  "role": "MEMBER" // or "ADMIN"
}
```

**GET /api/users** (List Users)

- Query parameters: `page`, `limit`, `role`, `search`
- Example: `/api/users?page=1&limit=10&role=MEMBER&search=john`

**GET /api/users/stats** (User Statistics)

**DELETE /api/users/:id** (Delete User)

**POST /api/users/:id/toggle-status** (Toggle User Status)

**POST /api/users/:id/resend-welcome** (Resend Welcome Email)

#### Admin or Own Profile Routes

**GET /api/users/:id** (Get User by ID)

**PUT /api/users/:id** (Update User)

```json
{
  "fullName": "Updated Name",
  "role": "ADMIN" // Only admin can change roles
}
```

## User Roles

### ADMIN

- Can create, read, update, delete all users
- Can access user statistics
- Can resend welcome emails
- Can change user roles
- Full access to all system features

### MEMBER

- Can view and update own profile
- Can change own password
- Access to financial management features
- Cannot manage other users

## Authentication Flow

### 1. Admin Creates User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -d '{
    "email": "newmember@company.com",
    "fullName": "John Doe",
    "role": "MEMBER"
  }'
```

### 2. User Receives Welcome Email

- Email contains login instructions
- User is marked as `isFirstLogin: true`
- No password is set initially

### 3. First-Time Login Attempt

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@company.com",
    "password": "anypassword"
  }'
```

Response:

```json
{
  "success": false,
  "message": "First-time login detected. Please set your password.",
  "requiresPasswordSetup": true,
  "userId": "user_id_here"
}
```

### 4. Password Setup

```bash
curl -X POST http://localhost:3000/api/auth/setup-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_from_previous_response",
    "password": "securepassword123",
    "confirmPassword": "securepassword123"
  }'
```

### 5. Successful Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@company.com",
    "password": "securepassword123"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "newmember@company.com",
      "fullName": "John Doe",
      "role": "MEMBER",
      "isFirstLogin": false,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 12
2. **JWT Tokens**: Secure token-based authentication with configurable expiration
3. **Role-Based Access**: Middleware enforces role-based permissions
4. **Email Verification**: Welcome emails ensure user awareness
5. **Password Reset**: Secure token-based password reset via email
6. **Input Validation**: All inputs are validated and sanitized

## Database Models

### User Model

```typescript
{
  email: string;           // Unique, lowercase, validated
  fullName: string;        // 2-100 characters
  password?: string;       // Hashed, optional for first-time users
  role: 'ADMIN' | 'MEMBER'; // Default: MEMBER
  lastLogin?: Date;        // Updated on each login
  isFirstLogin: boolean;   // Default: true
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate email)
- `500`: Internal Server Error

## Testing the System

### 1. Start the Server

```bash
npm run dev
```

### 2. Create First Admin User (Direct Database)

Since there's no registration endpoint, create the first admin user directly in MongoDB:

```javascript
// Connect to MongoDB and run this in MongoDB shell or Compass
db.users.insertOne({
  email: 'admin@company.com',
  fullName: 'System Administrator',
  password: '$2a$12$hashedPasswordHere', // Use bcrypt to hash a password
  role: 'ADMIN',
  isFirstLogin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

Or use the setup script (if created):

```bash
npm run setup-admin
```

### 3. Login as Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin_password"
  }'
```

### 4. Create New Users

Use the admin token to create new users, and they'll receive welcome emails.

## Troubleshooting

### Email Not Sending

1. Check SMTP credentials
2. Verify Gmail App Password (if using Gmail)
3. Check firewall/network restrictions
4. Review server logs for email errors

### JWT Token Issues

1. Verify JWT_SECRET is set
2. Check token expiration
3. Ensure proper Authorization header format: `Bearer <token>`

### Database Connection

1. Verify MongoDB is running
2. Check DATABASE_URL format
3. Ensure database permissions

### Permission Errors

1. Verify user role in database
2. Check middleware order in routes
3. Ensure proper authentication headers

## Next Steps

1. **Frontend Integration**: Build a React/Vue frontend to consume these APIs
2. **Email Templates**: Customize email templates for branding
3. **Audit Logging**: Add logging for user actions
4. **Rate Limiting**: Implement rate limiting for security
5. **Session Management**: Add session management features
6. **Two-Factor Authentication**: Implement 2FA for enhanced security
