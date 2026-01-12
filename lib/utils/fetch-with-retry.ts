/**
 * Fetch with Retry Utility
 * 
 * Wrapper around fetch with automatic retry logic for retryable errors
 */

import { isRetryableError, parseApiError, getUserFriendlyError } from "./api-error"

interface FetchWithRetryOptions extends RequestInit {
	maxRetries?: number
	retryDelay?: number
	timeout?: number
}

/**
 * Fetch with automatic retry and timeout handling
 */
export async function fetchWithRetry(
	url: string,
	options: FetchWithRetryOptions = {}
): Promise<Response> {
	const { maxRetries = 3, retryDelay = 1000, timeout = 30000, ...fetchOptions } = options

	let lastError: Error | null = null

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			// Create abort controller for timeout
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), timeout)

			try {
				const response = await fetch(url, {
					...fetchOptions,
					signal: controller.signal,
				})

				clearTimeout(timeoutId)

				// If response is ok, return it
				if (response.ok) {
					return response
				}

				// Parse error to check if retryable
				const error = await parseApiError(response)
				if (!isRetryableError(error) || attempt === maxRetries) {
					// Not retryable or max retries reached
					throw new Error(getUserFriendlyError(error))
				}

				lastError = new Error(getUserFriendlyError(error))
			} catch (err) {
				clearTimeout(timeoutId)

				if (err instanceof Error && err.name === "AbortError") {
					throw new Error("Request timed out. Please try again.")
				}

				if (err instanceof Error && !isRetryableError(err) || attempt === maxRetries) {
					throw err
				}

				lastError = err instanceof Error ? err : new Error("Unknown error")
			}

			// Wait before retrying (exponential backoff)
			if (attempt < maxRetries) {
				await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
			}
		} catch (err) {
			if (attempt === maxRetries) {
				throw err instanceof Error ? err : new Error("Request failed after retries")
			}
		}
	}

	throw lastError || new Error("Request failed")
}
