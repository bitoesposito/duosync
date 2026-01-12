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
import { useAuth, useI18n } from "@/hooks"

export default function LoginPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { authenticated, loading: authLoading, refreshAuth } = useAuth()
	const { t } = useI18n()
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [waitingForAuth, setWaitingForAuth] = useState(false)

	// Redirect to dashboard if already authenticated
	useEffect(() => {
		if (!authLoading && authenticated) {
			router.push("/dashboard")
		}
	}, [authLoading, authenticated, router])

	// Monitor authentication state after magic link verification
	useEffect(() => {
		if (waitingForAuth && !authLoading && authenticated) {
			// Auth state is now updated, safe to redirect
			setWaitingForAuth(false)
			// Get redirect URL from search params if available
			const redirectUrl = searchParams.get("redirectUrl") || "/dashboard"
			router.push(redirectUrl)
		}
	}, [waitingForAuth, authLoading, authenticated, router, searchParams])

	// Timeout fallback: if waiting for auth takes too long, redirect anyway
	// The cookie is set, so dashboard will work even if Redux state isn't synced yet
	useEffect(() => {
		if (waitingForAuth) {
			const redirectUrl = searchParams.get("redirectUrl") || "/dashboard"
			const timeout = setTimeout(() => {
				setWaitingForAuth(false)
				router.push(redirectUrl)
			}, 1000) // 1 second timeout

			return () => clearTimeout(timeout)
		}
	}, [waitingForAuth, router, searchParams])

	// Check if magic link token is present
	const [verifyingMagicLink, setVerifyingMagicLink] = useState(false)
	
	useEffect(() => {
		const token = searchParams.get("token")
		const emailParam = searchParams.get("email")
		
		if (token && emailParam && !verifyingMagicLink) {
			// Verify magic link client-side
			setVerifyingMagicLink(true)
			setLoading(true)
			setError(null)
			
			fetchWithRetry(`/api/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(emailParam)}`, {
				method: "GET",
				headers: {
					"Accept": "application/json",
				},
			})
				.then(async (response) => {
					if (response.ok) {
						const data = await response.json()
						// Success - refresh auth state immediately
						// The useEffect will handle redirect when authenticated becomes true
						setWaitingForAuth(true)
						// Store redirect URL in search params for the useEffect
						if (data.redirectUrl) {
							const url = new URL(window.location.href)
							url.searchParams.set("redirectUrl", data.redirectUrl)
							window.history.replaceState({}, "", url.toString())
						}
						refreshAuth()
						setVerifyingMagicLink(false)
						setLoading(false)
					} else {
						// Handle error
						const errorData = await response.json().catch(() => ({ error: "Failed to verify magic link" }))
						throw new Error(errorData.error || "Failed to verify magic link")
					}
				})
				.catch((err) => {
					setError(getUserFriendlyError(err instanceof Error ? err : new Error(String(err))))
					setVerifyingMagicLink(false)
					setLoading(false)
				})
		}
	}, [searchParams, verifyingMagicLink, router])

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
			setError(getUserFriendlyError(err instanceof Error ? err : new Error(String(err))))
		} finally {
			setLoading(false)
		}
	}

	// Show loading while checking authentication or waiting for auth after magic link verification
	if (authLoading || waitingForAuth) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loading size="lg" text={waitingForAuth ? t("auth.login.signingIn") : t("auth.login.checkingAuth")} />
			</div>
		)
	}

	// Don't render if authenticated (will redirect)
	if (authenticated) {
		return null
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center mb-2">
					<h1 className="text-3xl font-bold">{t("auth.login.title")}</h1>
					<p className="text-muted-foreground mt-2">
						{t("auth.login.emailDescription")}
					</p>
				</div>

				<form onSubmit={handleMagicLinkRequest} className="space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-medium mb-2">
							{t("auth.login.email")}
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
							placeholder={t("auth.login.emailPlaceholder")}
						/>
					<p className="text-xs text-muted-foreground mt-1">
						{t("auth.login.emailDescription")}{" "}
						<span className="font-medium">{t("common.tip")}:</span> {t("auth.login.emailTip")}
					</p>
					</div>

					{error && (
						<div className="space-y-2">
							<ErrorAlert error={error} onDismiss={() => setError(null)} />
							{error.includes("expired") || error.includes("Invalid") ? (
								<p className="text-xs text-muted-foreground">
									{t("auth.login.magicLinkExpiredTip")}
								</p>
							) : error.includes("not found") || error.includes("account") ? (
								<p className="text-xs text-muted-foreground">
									{t("auth.login.accountNotFoundTip")}{" "}
									<Link href="/register" className="text-primary hover:underline">
										{t("auth.login.createNewAccount")}
									</Link>
									.
								</p>
							) : null}
						</div>
					)}

					{success && (
						<SuccessAlert
							message={t("auth.login.magicLinkSent")}
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
								{t("auth.login.sending")}
							</>
						) : success ? (
							t("auth.login.emailSent")
						) : (
							t("auth.login.sendMagicLink")
						)}
					</button>
				</form>

				<div className="text-center space-y-2">
					<p className="text-sm text-muted-foreground">
						{t("auth.login.dontHaveAccount")}{" "}
						<Link href="/register" className="text-primary hover:underline font-medium">
							{t("auth.login.createOne")}
						</Link>
					</p>
					<Link href="/" className="text-sm text-muted-foreground hover:text-foreground block">
						{t("auth.login.backToHome")}
					</Link>
				</div>
			</div>
		</div>
	)
}
