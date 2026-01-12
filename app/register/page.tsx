/**
 * Registration Page
 * 
 * Register new account with passkey
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { startRegistration } from "@simplewebauthn/browser"
import Link from "next/link"
import { Loading, ErrorAlert } from "@/components/ui"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"
import { useAuth, useI18n } from "@/hooks"

type Step = "form" | "registering" | "verifying"

export default function RegisterPage() {
	const router = useRouter()
	const { authenticated, loading: authLoading, refreshAuth } = useAuth()
	const { t } = useI18n()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [step, setStep] = useState<Step>("form")
	const [error, setError] = useState<string | null>(null)
	const [waitingForAuth, setWaitingForAuth] = useState(false)

	// Redirect to dashboard if already authenticated
	useEffect(() => {
		if (!authLoading && authenticated) {
			router.push("/dashboard")
		}
	}, [authLoading, authenticated, router])

	// Monitor authentication state after registration
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

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setStep("registering")

		try {
			// Step 1: Request registration options
			const optionsResponse = await fetchWithRetry("/api/auth/passkey/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email: email || undefined }),
			})

			if (!optionsResponse.ok) {
				const error = await parseApiError(optionsResponse)
				throw new Error(getUserFriendlyError(error))
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
				const error = await parseApiError(verifyResponse)
				throw new Error(getUserFriendlyError(error))
			}

			// Success - refresh auth state immediately
			// The useEffect will handle redirect when authenticated becomes true
			setWaitingForAuth(true)
			refreshAuth()
			setLoading(false)
		} catch (err) {
			setError(getUserFriendlyError(err instanceof Error ? err : new Error(String(err))))
			setStep("form")
			setLoading(false)
		}
	}

	const getStepMessage = () => {
		switch (step) {
			case "registering":
				return t("auth.register.preparing")
			case "verifying":
				return t("auth.register.verifying")
			default:
				return t("auth.register.registering")
		}
	}

	// Show loading while checking authentication or waiting for auth after registration
	if (authLoading || waitingForAuth) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loading size="lg" text={waitingForAuth ? t("auth.register.creatingAccount") : t("common.loading")} />
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
				<div className="text-center">
					<h1 className="text-3xl font-bold">{t("auth.register.title")}</h1>
					<p className="text-muted-foreground mt-2">
						{t("auth.register.description")}
					</p>
					<div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
						<p className="text-xs text-muted-foreground text-left">
							<strong className="font-medium">{t("auth.register.whatArePasskeys")}</strong> {t("auth.register.passkeysDescription")}
						</p>
					</div>
				</div>

				<form onSubmit={handleRegister} className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium mb-2">
							{t("auth.register.nameRequired")}
						</label>
						<input
							id="name"
							type="text"
							required
							value={name}
							onChange={(e) => {
								setName(e.target.value)
								setError(null)
							}}
							disabled={loading}
							className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder={t("auth.register.namePlaceholder")}
						/>
					</div>

					<div>
						<label htmlFor="email" className="block text-sm font-medium mb-2">
							{t("auth.register.email")}
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value)
								setError(null)
							}}
							disabled={loading}
							className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder={t("auth.register.emailPlaceholder")}
						/>
						<p className="text-xs text-muted-foreground mt-1">
							{t("auth.register.emailDescription")}
						</p>
					</div>

					{error && (
						<div className="space-y-2">
							<ErrorAlert error={error} onDismiss={() => setError(null)} />
							{error.includes("email") || error.includes("already") ? (
								<p className="text-xs text-muted-foreground">
									{t("auth.register.emailAlreadyRegisteredTip")}{" "}
									<Link href="/login" className="text-primary hover:underline">
										{t("auth.register.signInInstead")}
									</Link>
									{" "}instead.
								</p>
							) : error.includes("passkey") || error.includes("credential") ? (
								<p className="text-xs text-muted-foreground">
									{t("auth.register.passkeyErrorTip")}
								</p>
							) : null}
						</div>
					)}

					<button
						type="submit"
						disabled={loading || !name}
						className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{loading ? (
							<>
								<Loading size="sm" />
								{getStepMessage()}
							</>
						) : (
							t("auth.register.registerWithPasskey")
						)}
					</button>
				</form>

				<div className="text-center space-y-2">
					<p className="text-sm text-muted-foreground">
						{t("auth.register.alreadyHaveAccount")}{" "}
						<Link href="/login" className="text-primary hover:underline font-medium">
							{t("auth.register.signIn")}
						</Link>
					</p>
					<Link href="/" className="text-sm text-muted-foreground hover:text-foreground block">
						{t("auth.register.backToHome")}
					</Link>
				</div>
			</div>
		</div>
	)
}
