/**
 * Logger Utility
 * 
 * Structured logging with pino
 * Note: pino-pretty transport is disabled in Next.js/Turbopack environment
 * as it causes module resolution issues. JSON output is used instead.
 * For pretty output in development, use: pnpm dev | pino-pretty
 */

import pino from "pino"
import { env } from "@/lib/env"

const isDevelopment = env.NODE_ENV === "development"

export const logger = pino({
	level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
	// Disable pino-pretty transport in Next.js/Turbopack
	// Use JSON output instead (can be piped to pino-pretty manually if needed)
	// Example: pnpm dev | pino-pretty
})
