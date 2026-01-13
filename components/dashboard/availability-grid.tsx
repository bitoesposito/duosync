/**
 * Availability Grid Component
 * 
 * Displays personal and shared availability timelines.
 * Receives pre-calculated segments from API instead of calculating them.
 * 
 * Changes from old version:
 * - Receives segments from useTimeline() hook (Redux)
 * - No local calculation (backend is source of truth)
 * - Supports multi-user connections
 * - Timezone-aware (segments already converted)
 */
"use client"

import { useMemo } from "react"
import { SparklesIcon, UserIcon } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useTimeline } from "@/hooks/use-timeline"
import { useConnections } from "@/hooks/use-connections"
import { TimelineSegmentCategory, TimelineSegment } from "@/types"

// Color mappings for personal timeline
const personalColorMap: Record<TimelineSegmentCategory, string> = {
	match: "bg-emerald-500 dark:bg-emerald-600",
	available: "bg-emerald-500 dark:bg-emerald-600",
	sleep: "bg-indigo-500 dark:bg-indigo-500",
	busy: "bg-slate-500 dark:bg-slate-500",
	other: "bg-slate-500 dark:bg-slate-500",
}

// Color mappings for shared timeline (only match segments are visible)
const sharedColorMap: Record<TimelineSegmentCategory, string> = {
	match: "bg-emerald-500 dark:bg-emerald-600",
	available: "bg-transparent",
	sleep: "bg-transparent",
	busy: "bg-transparent",
	other: "bg-transparent",
}

/**
 * Availability grid component that displays personal and shared timelines.
 * 
 * Features:
 * - Personal timeline: Shows user's own availability
 * - Shared timeline: Shows overlapping availability with connected users
 * - Receives pre-calculated segments from API
 * - Timezone-aware display
 * 
 * State management:
 * - Timeline segments: Fetched via useTimeline() hook
 * - Connections: Fetched via useConnections() hook
 * - Current date: Managed via date picker (future)
 */
export default function AvailabilityGrid() {
	const { t } = useI18n()
	const { personalSegments, sharedSegments, isLoading } = useTimeline()
	const { accepted, isLoading: isLoadingConnections } = useConnections()
	
	const hasConnections = accepted.length > 0
	const isLoadingGrid = isLoading || isLoadingConnections

	// Filter shared segments to only show "match" (overlapping availability)
	// Note: sharedSegments already contains only "match" segments from useTimeline,
	// but we filter again for safety
	const matchSegments = useMemo(
		() => sharedSegments.filter((segment: TimelineSegment) => segment.category === "match"),
		[sharedSegments]
	)

	const legendItems: { category: TimelineSegmentCategory; label: string }[] = [
		{ category: "available", label: t("availability.legendAvailable") },
		{ category: "busy", label: t("availability.legendBusy") },
		{ category: "sleep", label: t("availability.legendSleep") },
	]

	const getCategoryLabel = (category: TimelineSegmentCategory): string => {
		if (category === "available" || category === "match") return t("availability.legendAvailable")
		if (category === "sleep") return t("availability.legendSleep")
		return t("availability.legendBusy")
	}

	// TODO: Implement TimelineBar component (for now, simple placeholder)
	return (
		<section className="w-full flex flex-col gap-6 border-b border-border pb-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">{t("availability.title")}</h3>
				<div className="flex gap-4 text-xs">
					{legendItems.map((item) => (
						<div key={item.category} className="flex items-center gap-1">
							<div className={`w-3 h-3 rounded ${personalColorMap[item.category]}`} />
							<span>{item.label}</span>
						</div>
					))}
				</div>
			</div>

			<div
				className={`relative w-full flex flex-col gap-4 ${
					isLoadingGrid ? "opacity-40 pointer-events-none" : ""
				}`}
			>
				{/* Personal timeline */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<UserIcon className="w-4 h-4 text-muted-foreground" />
						<p className="text-sm font-medium text-foreground">
							{t("availability.personalTimeline")}
						</p>
					</div>
					<div className="h-14 bg-muted/5 rounded border-2 border-border p-2">
						{personalSegments.length === 0 ? (
							<p className="text-xs text-muted-foreground text-center py-4">
								{t("availability.noData")}
							</p>
						) : (
							<div className="flex h-full gap-1">
								{personalSegments.map((segment, idx) => (
									<div
										key={idx}
										className={`${personalColorMap[segment.category]} rounded`}
										style={{
											width: `${(parseFloat(segment.end) - parseFloat(segment.start)) / 24 * 100}%`,
											marginLeft: `${parseFloat(segment.start) / 24 * 100}%`,
										}}
										title={`${getCategoryLabel(segment.category)}: ${segment.start} - ${segment.end}`}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Shared timeline (only shown if user has connections) */}
				{hasConnections && (
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<SparklesIcon className="w-4 h-4 text-emerald-500" />
							<p className="text-sm font-medium text-foreground">
								{t("availability.sharedTimeline")}
							</p>
							{matchSegments.length > 0 && (
								<span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
									{matchSegments.length} {t("availability.freeSlots")}
								</span>
							)}
						</div>
						<div className="h-7 bg-emerald-50/30 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900 p-1">
							{matchSegments.length === 0 ? (
								<p className="text-xs text-muted-foreground text-center py-1">
									{t("availability.noFreeTime")}
								</p>
							) : (
								<div className="flex h-full gap-1">
									{matchSegments.map((segment, idx) => (
										<div
											key={idx}
											className={`${sharedColorMap[segment.category]} rounded`}
											style={{
												width: `${(parseFloat(segment.end) - parseFloat(segment.start)) / 24 * 100}%`,
												marginLeft: `${parseFloat(segment.start) / 24 * 100}%`,
											}}
											title={`${t("availability.legendAvailable")}: ${segment.start} - ${segment.end}`}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</section>
	)
}

