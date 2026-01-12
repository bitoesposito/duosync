/**
 * Dashboard Page
 * 
 * Main dashboard after authentication
 * Shows passkey registration prompt if user has no passkeys
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { startRegistration } from "@simplewebauthn/browser"
import { Loading, ErrorAlert, SuccessAlert } from "@/components/ui"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"
import { useAuth, useI18n } from "@/hooks"
import {
	hasDismissedPasskeyPrompt,
	dismissPasskeyPrompt,
	hasShownPromptThisSession,
	markPromptShown,
} from "@/lib/utils/passkey-prompt"

type PasskeyStep = "idle" | "registering" | "verifying"

export default function DashboardPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { user, authenticated, hasPasskeys, loading, logout, logoutLoading, refreshAuth } = useAuth()
	const { t } = useI18n()
	const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false)
	const [passkeyLoading, setPasskeyLoading] = useState(false)
	const [passkeyStep, setPasskeyStep] = useState<PasskeyStep>("idle")
	const [passkeyError, setPasskeyError] = useState<string | null>(null)
	const [passkeySuccess, setPasskeySuccess] = useState(false)

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!loading && !authenticated) {
			router.push("/login")
		}
	}, [loading, authenticated, router])

	// Show passkey prompt if needed (respecting user preferences)
	useEffect(() => {
		if (!user || hasPasskeys || loading) return

		const promptPasskey = searchParams.get("promptPasskey")
		
		// Always show if explicitly requested via URL parameter
		if (promptPasskey === "true") {
			setShowPasskeyPrompt(true)
			markPromptShown()
			return
		}

		// Don't show if user dismissed it permanently or already shown this session
		if (hasDismissedPasskeyPrompt() || hasShownPromptThisSession()) {
			return
		}

		// Show prompt if user has no passkeys
		setShowPasskeyPrompt(true)
		markPromptShown()
	}, [searchParams, user, hasPasskeys, loading])

	const handleLogout = async () => {
		try {
			await logout()
			router.push("/")
		} catch (err) {
			console.error("Logout error:", err)
			// Even if logout fails, redirect to home
			router.push("/")
		}
	}

	const handleRegisterPasskey = async () => {
		if (!user || !authenticated) return
		
		setPasskeyLoading(true)
		setPasskeyError(null)
		setPasskeySuccess(false)
		setPasskeyStep("registering")

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
				const error = await parseApiError(optionsResponse)
				throw new Error(getUserFriendlyError(error))
			}

			const options = await optionsResponse.json()

			// Step 2: Start WebAuthn registration
			setPasskeyStep("verifying")
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

			// Success - hide prompt and show success message
			setPasskeySuccess(true)
			setPasskeyError(null)
			setShowPasskeyPrompt(false)
			
			// Refresh auth state to update hasPasskeys
			refreshAuth()
			
			// Hide success message after 5 seconds (increased from 3)
			setTimeout(() => {
				setPasskeySuccess(false)
			}, 5000)
		} catch (err) {
			setPasskeyError(getUserFriendlyError(err))
			setPasskeyStep("idle")
		} finally {
			setPasskeyLoading(false)
		}
	}

	const getPasskeyStepMessage = () => {
		switch (passkeyStep) {
			case "registering":
				return t("auth.passkey.preparing")
			case "verifying":
				return t("auth.passkey.verifying")
			default:
				return t("auth.passkey.registering")
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loading size="lg" text={t("pages.dashboard.loading")} />
			</div>
		)
	}

	if (!user) {
		return null
	}

	return (
		<div className="flex min-h-screen flex-col p-8">
			<div className="mx-auto w-full max-w-4xl">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">{t("pages.dashboard.title")}</h1>
						<p className="text-muted-foreground mt-1">
							{t("pages.dashboard.welcome", { name: user.name })}
						</p>
					</div>
					
					<button
						onClick={handleLogout}
						disabled={logoutLoading}
						className="rounded-lg border border-input bg-background px-4 py-2 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{logoutLoading ? (
							<>
								<Loading size="sm" />
								{t("auth.logout.loggingOut")}
							</>
						) : (
							t("navigation.logout")
						)}
					</button>
				</div>

				{passkeySuccess && (
					<SuccessAlert
						message={t("auth.passkey.success")}
						onDismiss={() => setPasskeySuccess(false)}
						className="mb-6"
					/>
				)}

				{showPasskeyPrompt && (
					<div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
						<h2 className="text-lg font-semibold mb-2">🔐 {t("auth.passkey.saveOnDevice")}</h2>
						<p className="text-sm text-muted-foreground mb-2">
							{t("auth.passkey.noPasskeyYet")}
						</p>
						<p className="text-xs text-muted-foreground mb-4">
							{t("auth.passkey.biometricInfo")}
						</p>
						
						{passkeyError && (
							<div className="mb-4 space-y-2">
								<ErrorAlert error={passkeyError} onDismiss={() => setPasskeyError(null)} />
								{passkeyError.includes("cancelled") || passkeyError.includes("NotAllowed") ? (
									<p className="text-xs text-muted-foreground">
										{t("auth.passkey.cancelledTip")}
									</p>
								) : passkeyError.includes("browser") || passkeyError.includes("support") ? (
									<p className="text-xs text-muted-foreground">
										{t("auth.passkey.browserSupportTip")}
									</p>
								) : null}
							</div>
						)}
						
						<div className="flex gap-4">
							<button
								onClick={handleRegisterPasskey}
								disabled={passkeyLoading}
								className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{passkeyLoading ? (
									<>
										<Loading size="sm" />
										{getPasskeyStepMessage()}
									</>
								) : (
									t("auth.passkey.savePasskey")
								)}
							</button>
							
							<button
								onClick={() => {
									setShowPasskeyPrompt(false)
									dismissPasskeyPrompt()
								}}
								disabled={passkeyLoading}
								className="rounded-lg border border-input bg-background px-4 py-2 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
							>
								{t("auth.passkey.dontAskAgain")}
							</button>
						</div>
					</div>
				)}

				<div className="rounded-lg border border-input bg-card p-6">
					<h2 className="text-xl font-semibold mb-4">{t("pages.dashboard.accountInformation")}</h2>
					<dl className="space-y-2">
						<div>
							<dt className="text-sm font-medium text-muted-foreground">{t("pages.dashboard.name")}</dt>
							<dd className="text-sm">{user.name}</dd>
						</div>
						{user.email && (
							<div>
								<dt className="text-sm font-medium text-muted-foreground">{t("pages.dashboard.email")}</dt>
								<dd className="text-sm">{user.email}</dd>
							</div>
						)}
						<div>
							<dt className="text-sm font-medium text-muted-foreground">{t("pages.dashboard.userId")}</dt>
							<dd className="text-sm">{user.id}</dd>
						</div>
					</dl>
				</div>

				<div className="mt-8 rounded-lg border border-input bg-card p-6">
					<h2 className="text-xl font-semibold mb-4">{t("pages.dashboard.features")}</h2>
					<p className="text-muted-foreground">
						{t("pages.dashboard.featuresDescription")}
					</p>
				</div>
			</div>
		</div>
	)
}
