import { Request, Response, NextFunction } from "express";
import config from "../config";

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error Stack:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : config.nodeEnv === "development"
    ? err.message
    : "Something went wrong";

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : "Error",
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

export default errorMiddleware;
