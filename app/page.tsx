/**
 * Landing Page
 * 
 * Main entry point with login/register options
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { startAuthentication } from "@simplewebauthn/browser"
import { Loading, ErrorAlert } from "@/components/ui"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"
import { useAuth, useI18n } from "@/hooks"
import Logo from "@/components/logo"

export default function HomePage() {
	const router = useRouter()
	const { authenticated, loading: authLoading, refreshAuth } = useAuth()
	const { t } = useI18n()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [waitingForAuth, setWaitingForAuth] = useState(false)

	// Redirect to dashboard if already authenticated
	useEffect(() => {
		if (!authLoading && authenticated) {
			router.push("/dashboard")
		}
	}, [authLoading, authenticated, router])

	// Monitor authentication state after passkey login
	useEffect(() => {
		if (waitingForAuth && !authLoading && authenticated) {
			// Auth state is now updated, safe to redirect
			setWaitingForAuth(false)
			router.push("/dashboard")
		}
	}, [waitingForAuth, authLoading, authenticated, router])

	// Timeout fallback: if waiting for auth takes too long, redirect anyway
	// The cookie is set, so dashboard will work even if Redux state isn't synced yet
	useEffect(() => {
		if (waitingForAuth) {
			const timeout = setTimeout(() => {
				setWaitingForAuth(false)
				router.push("/dashboard")
			}, 1000) // 1 second timeout

			return () => clearTimeout(timeout)
		}
	}, [waitingForAuth, router])

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
					// Success - refresh auth state immediately
					// The useEffect will handle redirect when authenticated becomes true
					setWaitingForAuth(true)
					refreshAuth()
					setLoading(false)
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
					// User cancelled - show message and redirect to login
					setError(t("pages.home.passkeyCancelled"))
					setTimeout(() => {
						router.push("/login")
					}, 1500)
					return
				}
				setError(getUserFriendlyError(err instanceof Error ? err : new Error(String(err))))
				setLoading(false)
				return
			}
		} catch (err) {
			// Error or no passkeys, redirect to login
			const errorMessage = err instanceof Error ? err.message : String(err)
			if (errorMessage.includes("passkey") || errorMessage.includes("credential")) {
				setError(t("pages.home.noPasskeysFound"))
				setTimeout(() => {
					router.push("/login")
				}, 1500)
			} else {
				setError(getUserFriendlyError(err instanceof Error ? err : new Error(String(err))))
				setLoading(false)
			}
		}
	}

	// Show loading while checking authentication or waiting for auth after passkey login
	if (authLoading || waitingForAuth) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loading size="lg" text={waitingForAuth ? t("pages.home.signingIn") : t("pages.home.loading")} />
			</div>
		)
	}

	// Don't render if authenticated (will redirect)
	if (authenticated) {
		return null
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-8 text-center">
				<div className="flex items-center justify-center gap-3 mb-4">
					<Logo className="w-10 h-10" />
					<h1 className="text-4xl font-bold">{t("pages.home.title")}</h1>
				</div>
				<p className="text-muted-foreground">
					{t("pages.home.description")}
				</p>
				
				<div className="space-y-4">
					{error && (
						<div className="space-y-2">
							<ErrorAlert error={error} onDismiss={() => setError(null)} />
							{error.includes("cancelled") ? (
								<p className="text-xs text-muted-foreground">
									{t("pages.home.cancelledTip")}{" "}
									<Link href="/login" className="text-primary hover:underline">
										{t("pages.home.signInWithEmailLink")}
									</Link>
									{" "}{t("pages.home.instead")}
								</p>
							) : error.includes("passkey") || error.includes("credential") ? (
								<p className="text-xs text-muted-foreground">
									{t("pages.home.dontHavePasskeyTip")}{" "}
									<Link href="/login" className="text-primary hover:underline">
										{t("pages.home.signInWithEmailLink")}
									</Link>
									{" "}{t("pages.home.orCreateAccount")}{" "}
									<Link href="/register" className="text-primary hover:underline">
										{t("pages.home.createAnAccount")}
									</Link>
									.
								</p>
							) : null}
						</div>
					)}

					<button
						onClick={handleLogin}
						disabled={loading}
						className="block w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<span className="flex items-center justify-center gap-2">
								<Loading size="sm" />
								{error?.includes("Redirecting") ? t("pages.home.redirecting") : t("pages.home.checkingPasskeys")}
							</span>
						) : (
							t("pages.home.signIn")
						)}
					</button>
					
					<Link
						href="/register"
						className="block w-full rounded-lg border border-input bg-background px-6 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors text-center"
					>
						{t("pages.home.createNewAccount")}
					</Link>
					
					<div className="text-center">
						<Link
							href="/login"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							{t("pages.home.signInWithEmailLink")}
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
