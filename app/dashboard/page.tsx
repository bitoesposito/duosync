/**
 * Dashboard Page
 * 
 * Main dashboard after authentication
 * Shows passkey registration prompt if user has no passkeys
 */

"use client"

import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui"
import { useAuth, useI18n, useRequireAuth, usePasskeyPrompt } from "@/hooks"
import Dashboard from "@/components/dashboard"
import { PasskeyPrompt } from "@/components/auth/passkey-prompt"
import { AccountInfo } from "@/components/dashboard/account-info"

export default function DashboardPage() {
	const router = useRouter()
	const { user, logout, logoutLoading } = useAuth()
	const { t } = useI18n()
	const { loading } = useRequireAuth()
	const { showPrompt, dismissPrompt } = usePasskeyPrompt()

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

				{showPrompt && <PasskeyPrompt onDismiss={dismissPrompt} />}

				<AccountInfo />

				{/* Main Dashboard Component */}
				<div className="mt-8">
					<Dashboard />
				</div>
			</div>
		</div>
	)
}
