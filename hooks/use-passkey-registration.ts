/**
 * usePasskeyRegistration Hook
 * 
 * Handles passkey registration flow:
 * 1. Request registration options from API
 * 2. Start WebAuthn registration
 * 3. Verify registration with API
 * 4. Update auth state on success
 */

import { useState } from "react"
import { startRegistration } from "@simplewebauthn/browser"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"
import { useAuth } from "./use-auth"

type PasskeyStep = "idle" | "registering" | "verifying"

interface UsePasskeyRegistrationReturn {
	loading: boolean
	step: PasskeyStep
	error: string | null
	success: boolean
	registerPasskey: () => Promise<void>
	reset: () => void
}

export function usePasskeyRegistration(): UsePasskeyRegistrationReturn {
	const { user, authenticated, refreshAuth } = useAuth()
	const [loading, setLoading] = useState(false)
	const [step, setStep] = useState<PasskeyStep>("idle")
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	const registerPasskey = async () => {
		if (!user || !authenticated) return

		setLoading(true)
		setError(null)
		setSuccess(false)
		setStep("registering")

		try {
			// Step 1: Request registration options
			const optionsResponse = await fetchWithRetry("/api/auth/passkey/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-add-passkey": "true",
				},
				body: JSON.stringify({
					name: user.name,
					email: user.email || undefined,
				}),
			})

			if (!optionsResponse.ok) {
				const apiError = await parseApiError(optionsResponse)
				throw new Error(getUserFriendlyError(apiError))
			}

			const options = await optionsResponse.json()

			// Step 2: Start WebAuthn registration
			setStep("verifying")
			const credential = await startRegistration(options)

			// Step 3: Verify registration
			const verifyResponse = await fetchWithRetry("/api/auth/passkey/verify-registration", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(credential),
			})

			if (!verifyResponse.ok) {
				const apiError = await parseApiError(verifyResponse)
				throw new Error(getUserFriendlyError(apiError))
			}

			// Success - update state
			setSuccess(true)
			setError(null)

			// Refresh auth state to update hasPasskeys
			refreshAuth()

			// Hide success message after 5 seconds
			setTimeout(() => {
				setSuccess(false)
			}, 5000)
		} catch (err) {
			setError(getUserFriendlyError(err as Error | string))
			setStep("idle")
		} finally {
			setLoading(false)
		}
	}

	const reset = () => {
		setLoading(false)
		setStep("idle")
		setError(null)
		setSuccess(false)
	}

	return {
		loading,
		step,
		error,
		success,
		registerPasskey,
		reset,
	}
}

