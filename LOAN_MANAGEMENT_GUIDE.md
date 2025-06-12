# Loan Management System Guide

## Overview

The loan management system provides comprehensive functionality for managing member loans with interest calculations, payment tracking, and automated balance management. The system supports:

- **Loan Creation** - Admin can create loans for members
- **Interest Calculation** - Monthly interest based on outstanding balance
- **Payment Tracking** - Record and track all loan payments
- **Balance Management** - Automatic calculation of outstanding balances
- **Overdue Detection** - Identify overdue payments
- **Comprehensive Reporting** - Loan statistics and summaries

## Database Models

### Loan Model

```typescript
{
  memberId: ObjectId;           // Reference to User (member)
  loanNumber: string;           // Auto-generated unique loan number (LN20240001)
  loanType: LoanType;           // PERSONAL, BUSINESS, EMERGENCY, EDUCATION
  principalAmount: number;      // Original loan amount
  interestRate: number;         // Annual interest rate (percentage)
  loanTerm: number;            // Loan term in months
  monthlyInterestRate: number; // Calculated monthly rate (interestRate/12/100)
  disbursedAmount: number;     // Amount actually disbursed
  disbursedDate: Date;         // Date when loan was disbursed
  maturityDate: Date;          // Calculated maturity date
  status: LoanStatus;          // ACTIVE, COMPLETED, DEFAULTED, SUSPENDED
  purpose: string;             // Purpose of the loan
  guarantorId?: ObjectId;      // Optional guarantor reference
  collateral?: string;         // Collateral description
  notes?: string;              // Additional notes
  createdBy: ObjectId;         // Admin who created the loan
  approvedBy?: ObjectId;       // Admin who approved the loan
  approvedDate?: Date;         // Approval date
}
```

### LoanPayment Model

```typescript
{
  loanId: ObjectId;                // Reference to Loan
  paymentNumber: string;           // Auto-generated payment number (PAY202401001)
  paymentDate: Date;               // Date of payment
  paymentType: PaymentType;        // INTEREST, PRINCIPAL, COMBINED, PENALTY, LATE_FEE
  paymentMethod: PaymentMethod;    // CASH, BANK_TRANSFER, CHEQUE, ONLINE, UPI
  totalAmount: number;             // Total payment amount
  principalAmount: number;         // Principal portion
  interestAmount: number;          // Interest portion
  penaltyAmount?: number;          // Penalty amount (if any)
  lateFeeAmount?: number;          // Late fee amount (if any)
  outstandingBalanceAfter: number; // Outstanding balance after this payment               // Member who paid
  receivedBy: ObjectId;            // Staff who received payment
  receiptNumber?: string;          // Receipt number
  transactionReference?: string;   // Transaction reference
  notes?: string;                  // Payment notes
  isPartialPayment: boolean;       // Whether this is a partial payment
}
```

## API Endpoints

### Loan Management Routes (`/api/loans`)

#### Admin-Only Routes

**POST /api/loans** (Create Loan)

```json
{
  "memberId": "member_id_here",
  "loanType": "PERSONAL",
  "principalAmount": 50000,
  "interestRate": 12,
  "loanTerm": 24,
  "disbursedAmount": 50000,
  "disbursedDate": "2024-01-01",
  "purpose": "Home renovation",
  "guarantorId": "guarantor_id_here",
  "collateral": "Property documents",
  "notes": "Approved for home renovation"
}
```

**GET /api/loans** (List Loans)

- Query parameters: `page`, `limit`, `status`, `memberId`, `loanType`, `search`
- Example: `/api/loans?page=1&limit=10&status=ACTIVE&memberId=member_id`

**GET /api/loans/stats** (Loan Statistics)

- Query parameters: `memberId` (optional)

**PUT /api/loans/:id** (Update Loan)

```json
{
  "loanType": "BUSINESS",
  "interestRate": 15,
  "purpose": "Updated purpose",
  "status": "SUSPENDED",
  "notes": "Updated notes"
}
```

#### Payment Management

**POST /api/loans/:loanId/payments** (Record Payment)

```json
{
  "paymentDate": "2024-01-15",
  "paymentType": "INTEREST",
  "paymentMethod": "CASH",
  "totalAmount": 500,
  "principalAmount": 0,
  "interestAmount": 500,
  "penaltyAmount": 0,
  "lateFeeAmount": 0,
  "receiptNumber": "RCP001",
  "transactionReference": "TXN123456",
  "notes": "Monthly interest payment"
}
```

**GET /api/loans/:loanId/payments** (Get Loan Payments)

- Query parameters: `page`, `limit`

#### Member and Admin Routes

**GET /api/loans/:id** (Get Loan Details)

- Returns loan with calculated balances and payment history

**GET /api/loans/member/:memberId?** (Get Member's Loans)

- If memberId not provided, returns current user's loans (for members)
- Admins can specify memberId to view any member's loans

## Interest Calculation Logic

### Monthly Interest Calculation

The system calculates interest monthly based on the outstanding principal balance:

```javascript
// Monthly interest rate calculation
monthlyInterestRate = annualInterestRate / 12 / 100;

// Monthly interest amount
monthlyInterest = outstandingBalance * monthlyInterestRate;
```

### Example Calculation

For a loan with:

- Principal: ₹50,000
- Annual Interest Rate: 12%
- Monthly Interest Rate: 1% (12/12/100)

**Month 1:**

- Outstanding Balance: ₹50,000
- Interest Due: ₹50,000 × 0.01 = ₹500

**After ₹10,000 principal payment:**

- Outstanding Balance: ₹40,000
- Next Month Interest: ₹40,000 × 0.01 = ₹400

## Payment Processing Workflow

### 1. Interest-Only Payments

```bash
curl -X POST http://localhost:3000/api/loans/loan_id/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "totalAmount": 500,
    "principalAmount": 0,
    "interestAmount": 500,
    "paymentType": "INTEREST",
    "paymentMethod": "CASH"
  }'
```

### 2. Combined Principal + Interest Payment

```bash
curl -X POST http://localhost:3000/api/loans/loan_id/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "totalAmount": 5500,
    "principalAmount": 5000,
    "interestAmount": 500,
    "paymentType": "COMBINED",
    "paymentMethod": "BANK_TRANSFER"
  }'
```

### 3. Payment with Penalty

```bash
curl -X POST http://localhost:3000/api/loans/loan_id/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "totalAmount": 600,
    "principalAmount": 0,
    "interestAmount": 500,
    "penaltyAmount": 100,
    "paymentType": "INTEREST",
    "paymentMethod": "CASH"
  }'
```

## Business Logic Features

### 1. Automatic Balance Calculation

- Outstanding balance is calculated in real-time based on payments
- System tracks principal payments separately from interest payments
- Balance updates automatically after each payment

### 2. Loan Status Management

- **ACTIVE**: Loan is active and accepting payments
- **COMPLETED**: Loan is fully paid (outstanding balance = 0)
- **DEFAULTED**: Loan has been marked as defaulted
- **SUSPENDED**: Loan payments are temporarily suspended

### 3. Overdue Detection

```javascript
// Check if loan is overdue
const nextPayment = await loan.calculateNextPaymentDue();
const isOverdue = nextPayment && new Date() > nextPayment.dueDate;
```

### 4. Payment Validation

- Total amount must equal sum of all components
- Payments only allowed on ACTIVE loans
- Principal payments cannot exceed outstanding balance

## Usage Examples

### Creating a Loan

```bash
# 1. Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin_password"
  }'

# 2. Create loan for member
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "memberId": "member_id_here",
    "principalAmount": 100000,
    "interestRate": 15,
    "loanTerm": 36,
    "purpose": "Business expansion",
    "loanType": "BUSINESS"
  }'
```

### Monthly Interest Payment

```bash
# Record monthly interest payment
curl -X POST http://localhost:3000/api/loans/loan_id/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "totalAmount": 1250,
    "principalAmount": 0,
    "interestAmount": 1250,
    "paymentType": "INTEREST",
    "paymentMethod": "CASH",
    "notes": "Monthly interest for January 2024"
  }'
```

### Checking Loan Status

```bash
# Get loan details with balances
curl -X GET http://localhost:3000/api/loans/loan_id \
  -H "Authorization: Bearer <token>"

# Response includes:
# - Loan details
# - Outstanding balance
# - Total interest paid
# - Next payment due
# - Payment history
```

### Member Viewing Their Loans

```bash
# Member can view their own loans
curl -X GET http://localhost:3000/api/loans/member \
  -H "Authorization: Bearer <member_token>"

# Admin can view any member's loans
curl -X GET http://localhost:3000/api/loans/member/member_id \
  -H "Authorization: Bearer <admin_token>"
```

## Loan Statistics and Reporting

### System-Wide Statistics

```bash
curl -X GET http://localhost:3000/api/loans/stats \
  -H "Authorization: Bearer <admin_token>"
```

Response:

```json
{
  "success": true,
  "data": {
    "loanSummary": {
      "totalLoans": 25,
      "activeLoans": 20,
      "completedLoans": 4,
      "defaultedLoans": 1,
      "totalPrincipalAmount": 2500000,
      "totalDisbursedAmount": 2500000
    },
    "paymentSummary": {
      "totalPayments": 150,
      "totalAmount": 375000,
      "totalPrincipal": 250000,
      "totalInterest": 125000
    },
    "overdueLoansCount": 3
  }
}
```

### Member-Specific Statistics

```bash
curl -X GET http://localhost:3000/api/loans/stats?memberId=member_id \
  -H "Authorization: Bearer <admin_token>"
```

## Interest Calculation Examples

### Example 1: Personal Loan

- **Principal**: ₹50,000
- **Interest Rate**: 12% per annum
- **Term**: 24 months

**Monthly Interest**: ₹50,000 × (12/12/100) = ₹500

**Payment Schedule**:

- Month 1: Interest ₹500 (Balance: ₹50,000)
- Month 2: Interest ₹500 (Balance: ₹50,000)
- Month 3: Principal ₹10,000 + Interest ₹500 (Balance: ₹40,000)
- Month 4: Interest ₹400 (Balance: ₹40,000)

### Example 2: Business Loan

- **Principal**: ₹200,000
- **Interest Rate**: 18% per annum
- **Term**: 36 months

**Monthly Interest**: ₹200,000 × (18/12/100) = ₹3,000

**After 6 months of interest-only payments**:

- **Principal Paid**: ₹0
- **Interest Paid**: ₹18,000
- **Outstanding Balance**: ₹200,000

**After ₹50,000 principal payment**:

- **Outstanding Balance**: ₹150,000
- **New Monthly Interest**: ₹150,000 × 0.015 = ₹2,250

## Security and Permissions

### Role-Based Access Control

**Admin Permissions**:

- Create, update, delete loans
- Record payments
- View all loans and statistics
- Manage loan status

**Member Permissions**:

- View own loans only
- View own payment history
- Check outstanding balances

### Data Validation

1. **Loan Creation**:

   - Member must exist and have MEMBER role
   - Principal amount must be positive
   - Interest rate must be between 0-100%
   - Loan term must be at least 1 month

2. **Payment Recording**:
   - Total amount must equal sum of components
   - Amounts must be non-negative
   - Loan must be ACTIVE status
   - Principal payment cannot exceed outstanding balance

## Error Handling

Common error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**HTTP Status Codes**:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Integration with Existing Systems

### Account Integration

Loan disbursements and payments can be integrated with the existing account system:

```javascript
// Example: Record loan disbursement as account transaction
await Transaction.create({
  accountId: cashAccountId,
  type: 'DEBIT',
  amount: loan.disbursedAmount,
  comment: `Loan disbursement - ${loan.loanNumber}`,
  enteredBy: adminId,
  transactionDate: loan.disbursedDate,
});

// Example: Record payment as account transaction
await Transaction.create({
  accountId: cashAccountId,
  type: 'CREDIT',
  amount: payment.totalAmount,
  comment: `Loan payment - ${loan.loanNumber}`,
  enteredBy: adminId,
  transactionDate: payment.paymentDate,
});
```

## Future Enhancements

1. **EMI Calculations**: Implement equated monthly installment calculations
2. **Automated Reminders**: Email/SMS reminders for due payments
3. **Late Fee Automation**: Automatic late fee calculation
4. **Loan Approval Workflow**: Multi-step approval process
5. **Document Management**: Upload and manage loan documents
6. **Credit Scoring**: Implement member credit scoring
7. **Loan Restructuring**: Handle loan modifications and restructuring
8. **Mobile App Integration**: APIs for mobile applications

## Testing the System

### 1. Create Test Data

```bash
# Create a member first
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "email": "member@test.com",
    "fullName": "Test Member"
  }'
```

### 2. Create a Loan

```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "memberId": "member_id_from_step_1",
    "principalAmount": 50000,
    "interestRate": 12,
    "loanTerm": 24,
    "purpose": "Test loan"
  }'
```

### 3. Record Interest Payment

```bash
curl -X POST http://localhost:3000/api/loans/loan_id/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "totalAmount": 500,
    "interestAmount": 500,
    "paymentType": "INTEREST"
  }'
```

### 4. Check Loan Status

```bash
curl -X GET http://localhost:3000/api/loans/loan_id \
  -H "Authorization: Bearer <admin_token>"
```

This comprehensive loan management system provides all the functionality needed to manage member loans with proper interest calculations, payment tracking, and balance management.
