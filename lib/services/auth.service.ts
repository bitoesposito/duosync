/**
 * Auth Service
 * 
 * Business logic for authentication (passkey, magic link, token)
 */

import { db } from "@/lib/db"
import { users, passkeyCredentials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"
import type { 
	AuthenticatorTransportFuture,
	CredentialDeviceType,
} from "@simplewebauthn/server"

/**
 * Create a new user with token
 */
export async function createUser(name: string, email?: string) {
	const token = randomUUID()
	
	const [user] = await db.insert(users).values({
		name,
		email: email || null,
		token,
	}).returning()
	
	return { user, token }
}

/**
 * Find user by token
 */
export async function findUserByToken(token: string) {
	return await db.query.users.findFirst({
		where: eq(users.token, token),
	})
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
	return await db.query.users.findFirst({
		where: eq(users.email, email),
	})
}

/**
 * Update user email
 */
export async function updateUserEmail(userId: number, email: string) {
	const [user] = await db.update(users)
		.set({ email, updatedAt: new Date() })
		.where(eq(users.id, userId))
		.returning()
	
	return user
}

/**
 * Store passkey credential
 */
export async function storePasskeyCredential(
	userId: number,
	credentialId: string,
	publicKey: string,
	counter: number,
	deviceType: CredentialDeviceType,
	transports?: AuthenticatorTransportFuture[],
	name?: string
) {
	const [credential] = await db.insert(passkeyCredentials).values({
		userId,
		credentialId,
		publicKey,
		counter,
		deviceType,
		transports: transports?.join(",") || null,
		name: name || null,
	}).returning()
	
	return credential
}

/**
 * Find passkey credential by credential ID
 */
export async function findPasskeyCredential(credentialId: string) {
	const credential = await db.query.passkeyCredentials.findFirst({
		where: eq(passkeyCredentials.credentialId, credentialId),
	})
	
	if (!credential) {
		return null
	}
	
	// Get user separately
	const user = await db.query.users.findFirst({
		where: eq(users.id, credential.userId),
	})
	
	return {
		...credential,
		user,
	}
}

/**
 * Update passkey credential counter
 */
export async function updatePasskeyCounter(
	credentialId: string,
	counter: number
) {
	const [credential] = await db.update(passkeyCredentials)
		.set({ 
			counter,
			lastUsedAt: new Date(),
		})
		.where(eq(passkeyCredentials.credentialId, credentialId))
		.returning()
	
	return credential
}

/**
 * Get all passkey credentials for a user
 */
export async function getUserPasskeys(userId: number) {
	return await db.query.passkeyCredentials.findMany({
		where: eq(passkeyCredentials.userId, userId),
		orderBy: (passkeys, { desc }) => [desc(passkeys.lastUsedAt)],
	})
}
