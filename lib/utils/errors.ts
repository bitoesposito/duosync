/**
 * Error codes and utilities for error handling
 */export enum ErrorCode {
  INTERVAL_INVALID = "INTERVAL_INVALID",
  CONNECTION_LIMIT_REACHED = "CONNECTION_LIMIT_REACHED",
  RECURRENCE_INVALID = "RECURRENCE_INVALID",
  UNAUTHORIZED = "UNAUTHORIZED",
  TIMELINE_TIMEOUT = "TIMELINE_TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}