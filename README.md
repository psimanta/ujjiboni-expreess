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

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Project Structure

```
├── src/
│   └── index.ts          # Main server file
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── nodemon.json         # Nodemon configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Development

1. Make changes to files in the `src/` directory
2. The development server will automatically restart
3. Build for production: `npm run build`
4. Start production server: `npm start`

## License

MIT 