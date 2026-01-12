/**
 * API Error Utilities
 * 
 * Utilities for handling and formatting API errors
 */

export interface ApiError {
	error: string
	code?: string
	statusCode?: number
}

/**
 * Parse error from API response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
	try {
		const data = await response.json()
		return {
			error: data.error || "An unexpected error occurred",
			code: data.code,
			statusCode: response.status,
		}
	} catch {
		return {
			error: `Request failed with status ${response.status}`,
			statusCode: response.status,
		}
	}
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: ApiError | Error | string): string {
	if (typeof error === "string") {
		return error
	}

	if (error instanceof Error) {
		// Handle specific WebAuthn errors
		if (error.name === "NotAllowedError") {
			return "Authentication was cancelled or not allowed. Please try again."
		}
		if (error.name === "InvalidStateError") {
			return "This passkey is already registered. Please use a different one."
		}
		if (error.name === "NotSupportedError") {
			return "Passkeys are not supported on this device or browser. Please use magic link instead."
		}
		if (error.name === "SecurityError") {
			return "Security error occurred. Please ensure you're using HTTPS in production."
		}
		if (error.name === "NetworkError" || error.message.includes("fetch")) {
			return "Network error. Please check your connection and try again."
		}
		return error.message || "An unexpected error occurred"
	}

	const apiError = error as ApiError

	// Map status codes to user-friendly messages
	if (apiError.statusCode === 400) {
		return apiError.error || "Invalid request. Please check your input."
	}
	if (apiError.statusCode === 401) {
		return "Authentication required. Please log in again."
	}
	if (apiError.statusCode === 404) {
		return apiError.error || "Resource not found."
	}
	if (apiError.statusCode === 409) {
		return apiError.error || "This resource already exists."
	}
	if (apiError.statusCode === 429) {
		return "Too many requests. Please wait a moment and try again."
	}
	if (apiError.statusCode === 500) {
		return "Server error. Please try again later."
	}

	return apiError.error || "An unexpected error occurred"
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError | Error): boolean {
	if (error instanceof Error) {
		return error.name === "NetworkError" || error.message.includes("fetch")
	}

	const apiError = error as ApiError
	// Retry on network errors or 5xx server errors
	return apiError.statusCode === undefined || (apiError.statusCode >= 500 && apiError.statusCode < 600)
}
