/**
 * PasskeyPrompt Component
 * 
 * Displays prompt to register passkey if user has none
 * Handles registration flow and error states
 */

"use client"

import { useEffect } from "react"
import { Loading, ErrorAlert, SuccessAlert } from "@/components/ui"
import { useI18n } from "@/hooks/use-i18n"
import { usePasskeyRegistration } from "@/hooks/use-passkey-registration"

interface PasskeyPromptProps {
	onDismiss: () => void
}

export function PasskeyPrompt({ onDismiss }: PasskeyPromptProps) {
	const { t } = useI18n()
	const { loading, step, error, success, registerPasskey, reset } = usePasskeyRegistration()

	// Hide prompt on successful registration
	useEffect(() => {
		if (success) {
			onDismiss()
		}
	}, [success, onDismiss])

	const getStepMessage = () => {
		switch (step) {
			case "registering":
				return t("auth.passkey.preparing")
			case "verifying":
				return t("auth.passkey.verifying")
			default:
				return t("auth.passkey.registering")
		}
	}

	return (
		<>
			{success && (
				<SuccessAlert
					message={t("auth.passkey.success")}
					onDismiss={() => reset()}
					className="mb-6"
				/>
			)}

			<div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
				<h2 className="text-lg font-semibold mb-2">🔐 {t("auth.passkey.saveOnDevice")}</h2>
				<p className="text-sm text-muted-foreground mb-2">
					{t("auth.passkey.noPasskeyYet")}
				</p>
				<p className="text-xs text-muted-foreground mb-4">
					{t("auth.passkey.biometricInfo")}
				</p>

				{error && (
				<div className="mb-4 space-y-2">
					<ErrorAlert error={error} onDismiss={() => {}} />
					{error.includes("cancelled") || error.includes("NotAllowed") ? (
						<p className="text-xs text-muted-foreground">
							{t("auth.passkey.cancelledTip")}
						</p>
					) : error.includes("browser") || error.includes("support") ? (
						<p className="text-xs text-muted-foreground">
							{t("auth.passkey.browserSupportTip")}
						</p>
					) : null}
				</div>
			)}

			<div className="flex gap-4">
				<button
					onClick={registerPasskey}
					disabled={loading}
					className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				>
					{loading ? (
						<>
							<Loading size="sm" />
							{getStepMessage()}
						</>
					) : (
						t("auth.passkey.savePasskey")
					)}
				</button>

				<button
					onClick={onDismiss}
					disabled={loading}
					className="rounded-lg border border-input bg-background px-4 py-2 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
				>
					{t("auth.passkey.dontAskAgain")}
				</button>
			</div>
		</div>
		</>
	)
}

