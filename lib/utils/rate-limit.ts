/**
 * Rate Limiting Utility
 * 
 * Rate limiting using @upstash/ratelimit
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

// Create Redis client (only if UPSTASH_REDIS_REST_URL is set)
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
	redis = new Redis({
		url: process.env.UPSTASH_REDIS_REST_URL,
		token: process.env.UPSTASH_REDIS_REST_TOKEN,
	})

	// Rate limiter for authenticated users
	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
		analytics: true,
	})

	logger.info("Rate limiting enabled with Upstash Redis")
} else {
	logger.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL not configured")
}

/**
 * Check rate limit for a given identifier
 * 
 * @param identifier - Unique identifier (IP address or userId)
 * @param limit - Custom limit (optional, defaults to 100/min)
 * @returns Object with `success` and `remaining` requests
 */
export async function checkRateLimit(
	identifier: string,
	limit?: { requests: number; window: string }
): Promise<{ success: boolean; remaining: number; reset: number }> {
	// If rate limiting is not configured, allow all requests
	if (!ratelimit || !redis) {
		return { success: true, remaining: 999, reset: Date.now() + 60000 }
	}

	// Use custom limit if provided
	const limiter = limit
		? new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(limit.requests, limit.window as any),
				analytics: true,
			})
		: ratelimit

	const result = await limiter.limit(identifier)

	return {
		success: result.success,
		remaining: result.remaining,
		reset: result.reset,
	}
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(remaining: number, reset: number) {
	return {
		"X-RateLimit-Remaining": remaining.toString(),
		"X-RateLimit-Reset": reset.toString(),
	}
}
