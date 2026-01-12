/**
 * Environment variables with default values
 * App always starts, even without .env file
 * 
 * In Docker, variables are passed from docker-compose.yml with default values
 * for Docker environment (e.g. db:5432 instead of localhost:5432)
 * 
 * In local development, uses default values for localhost
 */

const isProduction = process.env.NODE_ENV === 'production'

export const env = {
	DATABASE_URL: process.env.DATABASE_URL || 
		'postgresql://postgres:postgres@localhost:5432/duosync?sslmode=disable',
	
	NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 
		'dev-secret-change-in-production-' + Math.random().toString(36),
	
	NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
	
	EMAIL_SERVER: process.env.EMAIL_SERVER || 'smtp://localhost:1025',
	
	EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@localhost',
	
	NODE_ENV: process.env.NODE_ENV || 'development',
	
	// Database connection details (useful for Drizzle)
	POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
	POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
	POSTGRES_DB: process.env.POSTGRES_DB || 'duosync',
} as const

// Production warnings
if (isProduction) {
	if (env.NEXTAUTH_SECRET.includes('dev-secret')) {
		console.warn('⚠️  WARNING: Using default NEXTAUTH_SECRET in production!')
	}
	if (env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('db:')) {
		console.warn('⚠️  WARNING: Using default DATABASE_URL in production!')
	}
}

if (!env.EMAIL_SERVER || env.EMAIL_SERVER === '') {
	console.info('ℹ️  Magic link disabled: EMAIL_SERVER not set')
} else {
	console.info(`ℹ️  Email server configured: ${env.EMAIL_SERVER}`)
}
