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

interface User {
	id: number
	name: string
	email?: string | null
}

type PasskeyStep = "idle" | "registering" | "verifying"

export default function DashboardPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [logoutLoading, setLogoutLoading] = useState(false)
	const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false)
	const [passkeyLoading, setPasskeyLoading] = useState(false)
	const [passkeyStep, setPasskeyStep] = useState<PasskeyStep>("idle")
	const [passkeyError, setPasskeyError] = useState<string | null>(null)
	const [passkeySuccess, setPasskeySuccess] = useState(false)

	useEffect(() => {
		checkAuth()
		const promptPasskey = searchParams.get("promptPasskey")
		if (promptPasskey === "true") {
			setShowPasskeyPrompt(true)
		}
	}, [searchParams])

	const checkAuth = async () => {
		try {
			const response = await fetchWithRetry("/api/auth/check", {
				method: "GET",
			})

			if (!response.ok) {
				router.push("/login")
				return
			}

			const data = await response.json()
			
			if (!data.authenticated) {
				router.push("/login")
				return
			}
			
			setUser(data.user)
			
			// Check if user has passkeys (from auth check response)
			if (data.user && !showPasskeyPrompt && !data.hasPasskeys) {
				setShowPasskeyPrompt(true)
			}
		} catch (err) {
			console.error("Auth check error:", err)
			router.push("/login")
		} finally {
			setLoading(false)
		}
	}

	const handleLogout = async () => {
		setLogoutLoading(true)
		
		try {
			await fetchWithRetry("/api/auth/logout", {
				method: "POST",
			})
			
			router.push("/")
		} catch (err) {
			console.error("Logout error:", err)
			// Even if logout fails, redirect to home
			router.push("/")
		} finally {
			setLogoutLoading(false)
		}
	}

	const handleRegisterPasskey = async () => {
		if (!user) return
		
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
			
			// Hide success message after 3 seconds
			setTimeout(() => {
				setPasskeySuccess(false)
			}, 3000)
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
				return "Preparing passkey registration..."
			case "verifying":
				return "Verifying your passkey..."
			default:
				return "Registering..."
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loading size="lg" text="Loading..." />
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
						<h1 className="text-3xl font-bold">Dashboard</h1>
						<p className="text-muted-foreground mt-1">
							Welcome, {user.name}!
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
								Logging out...
							</>
						) : (
							"Logout"
						)}
					</button>
				</div>

				{passkeySuccess && (
					<SuccessAlert
						message="Passkey successfully saved! You can now use it to sign in quickly."
						onDismiss={() => setPasskeySuccess(false)}
						className="mb-6"
					/>
				)}

				{showPasskeyPrompt && (
					<div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
						<h2 className="text-lg font-semibold mb-2">Save a passkey on this device</h2>
						<p className="text-sm text-muted-foreground mb-4">
							You haven't saved a passkey on this device yet. Save it now to sign in more easily in the future without entering your email.
						</p>
						
						{passkeyError && (
							<div className="mb-4">
								<ErrorAlert error={passkeyError} onDismiss={() => setPasskeyError(null)} />
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
									"Save Passkey"
								)}
							</button>
							
							<button
								onClick={() => setShowPasskeyPrompt(false)}
								disabled={passkeyLoading}
								className="rounded-lg border border-input bg-background px-4 py-2 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
							>
								Skip for now
							</button>
						</div>
					</div>
				)}

				<div className="rounded-lg border border-input bg-card p-6">
					<h2 className="text-xl font-semibold mb-4">Account Information</h2>
					<dl className="space-y-2">
						<div>
							<dt className="text-sm font-medium text-muted-foreground">Name</dt>
							<dd className="text-sm">{user.name}</dd>
						</div>
						{user.email && (
							<div>
								<dt className="text-sm font-medium text-muted-foreground">Email</dt>
								<dd className="text-sm">{user.email}</dd>
							</div>
						)}
						<div>
							<dt className="text-sm font-medium text-muted-foreground">User ID</dt>
							<dd className="text-sm">{user.id}</dd>
						</div>
					</dl>
				</div>

				<div className="mt-8 rounded-lg border border-input bg-card p-6">
					<h2 className="text-xl font-semibold mb-4">Features</h2>
					<p className="text-muted-foreground">
						Main features will be available here.
					</p>
				</div>
			</div>
		</div>
	)
}
