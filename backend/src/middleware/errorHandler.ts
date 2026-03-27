import { Request, Response, NextFunction } from "express";
import { CursorError } from "../helpers/pagination";

export interface ApiError {
  error: string;
  message: string;
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

 
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  void _req;
  void _next;
  if (err instanceof AppError) {
    const body = {
      error: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    };
    res.status(err.statusCode).json(body);
    return;
  }
  if (err instanceof CursorError) {
    res.status(400).json({ error: "invalid_cursor", message: err.message } satisfies ApiError);
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal_error", message: "An unexpected error occurred." } satisfies ApiError);
}
