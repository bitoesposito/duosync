/**
 * Registration Page
 * 
 * Register new account with passkey
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startRegistration } from "@simplewebauthn/browser"
import Link from "next/link"
import { Loading, ErrorAlert } from "@/components/ui"
import { getUserFriendlyError, parseApiError } from "@/lib/utils/api-error"
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry"

type Step = "form" | "registering" | "verifying"

export default function RegisterPage() {
	const router = useRouter()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [step, setStep] = useState<Step>("form")
	const [error, setError] = useState<string | null>(null)

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

			// Success - redirect to dashboard
			router.push("/dashboard")
		} catch (err) {
			setError(getUserFriendlyError(err))
			setStep("form")
			setLoading(false)
		}
	}

	const getStepMessage = () => {
		switch (step) {
			case "registering":
				return "Preparing passkey registration..."
			case "verifying":
				return "Verifying your passkey..."
			default:
				return "Registering..."
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold">Create New Account</h1>
					<p className="text-muted-foreground mt-2">
						Create your account with a passkey for secure and fast access
					</p>
				</div>

				<form onSubmit={handleRegister} className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium mb-2">
							Name *
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
							placeholder="Your name"
						/>
					</div>

					<div>
						<label htmlFor="email" className="block text-sm font-medium mb-2">
							Email
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
							placeholder="your@email.com (optional)"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							Email allows you to sign in on other devices via magic link
						</p>
					</div>

					{error && (
						<ErrorAlert error={error} onDismiss={() => setError(null)} />
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
							"Register with Passkey"
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
