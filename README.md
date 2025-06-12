# Ujjiboni Express

A minimal Express.js and TypeScript boilerplate with environment variable support.

## Features

- ✅ **Express.js** - Fast, unopinionated web framework
- ✅ **TypeScript** - Type-safe JavaScript
- ✅ **Environment Variables** - Configuration management with dotenv
- ✅ **Security** - Helmet.js for security headers
- ✅ **CORS** - Cross-Origin Resource Sharing support
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Health Check** - Built-in health check endpoint
- ✅ **Hot Reload** - Development server with nodemon auto-restart
- ✅ **Code Formatting** - Prettier with pre-commit hooks via Husky
- ✅ **Database Integration** - MongoDB with Mongoose ODM
- ✅ **Account Model** - Financial accounts with CRUD operations
- ✅ **Transaction Model** - Financial transactions with account references
- ✅ **MVC Architecture** - Controllers separated from routes for better organization
- ✅ **Data Relationships** - Mongoose population for account details in transactions

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with nodemon (watches for changes)
- `npm run dev:ts` - Start development server with ts-node directly
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run clean` - Clean build directory
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly

## API Endpoints

### System

- `GET /` - Welcome message
- `GET /health` - Health check endpoint (includes database status)

### Accounts (Financial Accounts)

- `GET /accounts` - Get all accounts
- `GET /accounts/:id` - Get account by ID
- `POST /accounts` - Create new account

### Transactions (Financial Transactions)

- `GET /transactions` - Get all transactions with pagination and filtering
- `GET /transactions/:id` - Get transaction by ID
- `GET /transactions/account/:accountId` - Get transactions for specific account
- `GET /transactions/account/:accountId/balance` - Get account balance and summary
- `POST /transactions` - Create new transaction (debit/credit)
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - MongoDB connection string (default: mongodb://localhost:27017/ujjiboni)
- `DATABASE_NAME` - Database name (default: ujjiboni)

## Project Structure

```
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers (business logic)
│   ├── database/         # Database connection
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API route definitions
│   └── index.ts          # Main server file
├── .husky/               # Git hooks configuration
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── .prettierrc          # Prettier configuration
├── .prettierignore      # Prettier ignore rules
├── nodemon.json         # Nodemon configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Development

1. Make changes to files in the `src/` directory
2. The development server will automatically restart
3. Code will be automatically formatted on commit (via Husky + Prettier)
4. Build for production: `npm run build`
5. Start production server: `npm start`

### Code Formatting

This project uses **Prettier** for automatic code formatting with the following rules:

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100 character line width
- Trailing commas where valid

**Automatic formatting** happens on every git commit via Husky pre-commit hooks.

You can also format manually:

```bash
npm run format        # Format all files
npm run format:check  # Check formatting without changes
```

## License

MIT
