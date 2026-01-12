/**
 * Login Page
 * 
 * Login with magic link
 * After magic link verification, suggests passkey registration if not present
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loading, ErrorAlert, SuccessAlert } from "@/components/ui"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"

export default function LoginPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [checkingAuth, setCheckingAuth] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	// Check if magic link token is present
	useEffect(() => {
		const token = searchParams.get("token")
		const emailParam = searchParams.get("email")
		
		if (token && emailParam) {
			// Magic link verification happens server-side via GET request
			// The API route will redirect to dashboard or show passkey registration prompt
			window.location.href = `/api/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(emailParam)}`
		}
	}, [searchParams])

	// Check if user is already authenticated (via token cookie)
	useEffect(() => {
		const checkToken = async () => {
			try {
				const response = await fetchWithRetry("/api/auth/check", {
					method: "GET",
				})

				if (response.ok) {
					const data = await response.json()
					if (data.authenticated) {
						router.push("/dashboard")
						return
					}
				}
			} catch (err) {
				// Not authenticated, continue
			} finally {
				setCheckingAuth(false)
			}
		}
		
		checkToken()
	}, [router])

	const handleMagicLinkRequest = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setSuccess(false)

		try {
			const response = await fetchWithRetry("/api/auth/magic-link/request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			})

			if (!response.ok) {
				const error = await parseApiError(response)
				throw new Error(getUserFriendlyError(error))
			}

			// Show success message
			setSuccess(true)
			setError(null)
		} catch (err) {
			setError(getUserFriendlyError(err))
		} finally {
			setLoading(false)
		}
	}

	if (checkingAuth) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loading size="lg" text="Checking authentication..." />
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold">Sign In</h1>
					<p className="text-muted-foreground mt-2">
						Enter your email to receive a magic link
					</p>
				</div>

				<form onSubmit={handleMagicLinkRequest} className="space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-medium mb-2">
							Email
						</label>
						<input
							id="email"
							type="email"
							required
							value={email}
							onChange={(e) => {
								setEmail(e.target.value)
								setError(null)
								setSuccess(false)
							}}
							disabled={loading || success}
							className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="your@email.com"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							We'll send you a magic link to sign in. If you haven't saved a passkey on this device yet, we'll suggest doing so after login.
						</p>
					</div>

					{error && (
						<ErrorAlert error={error} onDismiss={() => setError(null)} />
					)}

					{success && (
						<SuccessAlert
							message="If an account exists with this email, we've sent you a magic link. Please check your inbox."
							onDismiss={() => setSuccess(false)}
						/>
					)}

					<button
						type="submit"
						disabled={loading || !email || success}
						className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{loading ? (
							<>
								<Loading size="sm" />
								Sending...
							</>
						) : success ? (
							"Email Sent!"
						) : (
							"Send Magic Link"
						)}
					</button>
				</form>

				<div className="text-center">
					<Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
						← Back to home
					</Link>
				</div>
			</div>
		</div>
	)
}
