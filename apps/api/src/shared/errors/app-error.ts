import type { ErrorCode } from './error-codes.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly fields?: Record<string, string>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
