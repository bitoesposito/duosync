/**
 * Dashboard Page
 * 
 * Main dashboard after authentication
 * Shows passkey registration prompt if user has no passkeys
 */

"use client"

import { Loading } from "@/components/ui"
import { useAuth, useI18n, useRequireAuth, usePasskeyPrompt } from "@/hooks"
import Dashboard from "@/components/dashboard"
import { PasskeyPrompt } from "@/components/auth/passkey-prompt"

export default function DashboardPage() {
	const { user } = useAuth()
	const { t } = useI18n()
	const { loading } = useRequireAuth()
	const { showPrompt, dismissPrompt } = usePasskeyPrompt()

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
		<>
			{showPrompt && <PasskeyPrompt onDismiss={dismissPrompt} />}

			{/* Main Dashboard Component */}
			<div className="mt-8">
				<Dashboard />
			</div>
		</>
	)
}
