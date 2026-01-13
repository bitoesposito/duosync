/**
 * Main dashboard component that orchestrates the dashboard layout.
 * 
 * Uses Redux hooks for state management:
 * - useAuth() for current user
 * - useIntervals() for intervals management
 * - useTimeline() for timeline segments
 * - useConnections() for user connections
 * 
 * Layout:
 * - Left column: Form to create intervals (sticky on desktop)
 * - Right column: Availability timeline + Intervals list
 */
"use client"

import { useMemo } from "react"
import AvailabilityGrid from "./availability-grid"
import IntervalsForm from "./intervals-form"
import IntervalsList from "./intervals-list"
import { useI18n } from "@/hooks/use-i18n"
import { useAuth } from "@/hooks/use-auth"
import { useIntervals } from "@/hooks/use-intervals"
import { useTimeline } from "@/hooks/use-timeline"
import { useConnections } from "@/hooks/use-connections"
import { Loader2Icon } from "lucide-react"

export default function Dashboard() {
	const { user: activeUser, loading: isLoadingUsers } = useAuth()
	const { isLoading: isLoadingIntervals } = useIntervals()
	const { accepted, isLoading: isLoadingConnections } = useConnections()
	const { t } = useI18n()

	// Configure timeline with current user + accepted connections
	const timelineUserIds = useMemo(() => {
		if (!activeUser?.id) return []
		
		const userIds = [activeUser.id]
		
		// Add connected user IDs from accepted connections
		accepted.forEach((connection) => {
			// Determine the other user ID in the connection
			const otherUserId = connection.requesterId === activeUser.id 
				? connection.addresseeId 
				: connection.requesterId
			
			if (!userIds.includes(otherUserId)) {
				userIds.push(otherUserId)
			}
		})
		
		return userIds
	}, [activeUser?.id, accepted])

	// Get timeline with userIds - pass directly to hook
	// The hook will skip the query if userIds is empty, so isLoading will be false
	const { isLoading: isLoadingTimeline } = useTimeline(undefined, timelineUserIds)

	const greetingName = activeUser?.name ?? t("dashboard.greetingFallback")
	
	// Only show overlay if we're actually loading data
	// Timeline and connections queries are skipped when no data is available,
	// so isLoading will be false in those cases (handled in hooks)
	const showOverlay = isLoadingUsers || isLoadingIntervals || isLoadingTimeline || isLoadingConnections

	return (
		<main className="max-w-5xl mx-auto py-4 px-4 lg:px-0 flex flex-col gap-4 relative">
			{showOverlay && <DashboardLoader />}
			
			<header
				className={`space-y-0.5 ${showOverlay ? "opacity-40 pointer-events-none" : ""}`}
			>
				<h2 className="text-xl font-medium tracking-tight">
					{t("dashboard.greeting", { name: greetingName })}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("dashboard.subtitle")}
				</p>
			</header>

			<DashboardContent showOverlay={showOverlay} />
		</main>
	)
}

/**
 * Main dashboard content grid with form on the left and timeline/list on the right.
 * 
 * Layout:
 * - Mobile: Stacked (form above, timeline/list below)
 * - Desktop: Two columns (form left, timeline/list right)
 * - Form is sticky on desktop for better UX
 */
function DashboardContent({ showOverlay }: { showOverlay: boolean }) {
	return (
		<div
			className={`grid grid-cols-12 gap-4 items-start ${
				showOverlay ? "opacity-40 pointer-events-none" : ""
			}`}
		>
			{/* Left column: Form to create intervals */}
			<div className="col-span-12 md:col-span-4 lg:col-span-3 md:sticky md:top-6 relative z-10 md:z-auto">
				<IntervalsForm />
			</div>

			{/* Right column: Timeline and intervals list */}
			<div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
				<AvailabilityGrid />
				<IntervalsList />
			</div>
		</div>
	)
}

/**
 * Loading overlay displayed when data is being fetched.
 */
function DashboardLoader() {
	const { t } = useI18n()
	return (
		<div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-sm">
			<Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
			<p className="text-sm text-muted-foreground">
				{t("availability.loading")}
			</p>
		</div>
	)
}

