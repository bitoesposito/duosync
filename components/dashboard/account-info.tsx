/**
 * AccountInfo Component
 * 
 * Displays user account information (name, email, user ID)
 */

"use client"

import { useI18n } from "@/hooks/use-i18n"
import { useAuth } from "@/hooks/use-auth"

export function AccountInfo() {
	const { t } = useI18n()
	const { user } = useAuth()

	if (!user) return null

	return (
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
	)
}

