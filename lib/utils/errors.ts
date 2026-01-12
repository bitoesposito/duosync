/**
 * Error Codes and Utilities
 * 
 * Standardized error codes for API responses
 */

export const ERROR_CODES = {
	INTERVAL_INVALID: "INTERVAL_INVALID",
	CONNECTION_LIMIT_REACHED: "CONNECTION_LIMIT_REACHED",
	RECURRENCE_INVALID: "RECURRENCE_INVALID",
	UNAUTHORIZED: "UNAUTHORIZED",
	TIMELINE_TIMEOUT: "TIMELINE_TIMEOUT",
	NETWORK_ERROR: "NETWORK_ERROR",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export interface ApiError {
	error: {
		code: ErrorCode
		message: string
	}
}

export function createApiError(code: ErrorCode, message: string): ApiError {
	return {
		error: {
			code,
			message,
		},
	}
}
