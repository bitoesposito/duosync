/**
 * Landing Page
 * 
 * Main entry point with login/register options
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { startAuthentication } from "@simplewebauthn/browser"
import { Loading, ErrorAlert } from "@/components/ui"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"

export default function HomePage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleLogin = async () => {
		setLoading(true)
		setError(null)

		try {
			// Try to discover passkeys first
			const optionsResponse = await fetchWithRetry("/api/auth/passkey/discover", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			})

			if (!optionsResponse.ok) {
				// No passkeys available, redirect to login page
				router.push("/login")
				return
			}

			const options = await optionsResponse.json()

			// Try to start authentication with discovered passkeys
			// This will trigger Bitwarden/password manager to show available passkeys
			try {
				const credential = await startAuthentication(options)

				// Verify authentication
				const verifyResponse = await fetchWithRetry("/api/auth/passkey/verify-discover", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(credential),
				})

				if (verifyResponse.ok) {
					// Success - redirect to dashboard
					router.push("/dashboard")
					return
				} else {
					const error = await parseApiError(verifyResponse)
					setError(getUserFriendlyError(error))
					setLoading(false)
					return
				}
			} catch (err) {
				// User cancelled or no passkey found
				// This is normal if no discoverable passkeys are available
				if (err instanceof Error && err.name === "NotAllowedError") {
					// User cancelled - silently redirect to login
					router.push("/login")
					return
				}
				setError(getUserFriendlyError(err))
				setLoading(false)
				return
			}
		} catch (err) {
			// Error or no passkeys, redirect to login
			setError(getUserFriendlyError(err))
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-8 text-center">
				<h1 className="text-4xl font-bold">DuoSync</h1>
				<p className="text-muted-foreground">
					Sincronizza i tuoi calendari e trova slot liberi comuni
				</p>
				
				<div className="space-y-4 pt-8">
					{error && (
						<ErrorAlert error={error} onDismiss={() => setError(null)} />
					)}

					<button
						onClick={handleLogin}
						disabled={loading}
						className="block w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<span className="flex items-center justify-center gap-2">
								<Loading size="sm" />
								Checking for passkeys...
							</span>
						) : (
							"Sign In"
						)}
					</button>
					
					<Link
						href="/register"
						className="block w-full rounded-lg border border-input bg-background px-6 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
					>
						Create New Account
					</Link>
				</div>
			</div>
		</div>
	)
}
