/**
 * Dashboard Layout
 * 
 * Layout wrapper for dashboard pages
 * Includes header with user menu, language switcher, and logout
 */

"use client"

import { DashboardHeader } from "@/components/ui/header"

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex min-h-screen flex-col p-8">
			<div className="mx-auto w-full max-w-4xl">
				<DashboardHeader />
				{children}
			</div>
		</div>
	)
}
