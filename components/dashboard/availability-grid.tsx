/**
 * Availability Grid Component
 * 
 * Displays personal and shared availability timelines with a specific "raw/premium" aesthetic.
 * Matches design reference: Dark theme, solid vibrant bars, minimal layout.
 */
"use client"

import { useMemo } from "react"
import { SparklesIcon, UserIcon } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useTimeline } from "@/hooks/use-timeline"
import { useConnections } from "@/hooks/use-connections"
import { TimelineSegmentCategory, TimelineSegment as TimelineSegmentType } from "@/types"
import { TimelineBar } from "./timeline/timeline-bar"
import { TimelineSegment } from "./timeline/timeline-segment"

export default function AvailabilityGrid() { // Default export as requested
	const { t } = useI18n()
	const { personalSegments, sharedSegments, isLoading } = useTimeline()
	const { accepted, isLoading: isLoadingConnections } = useConnections()

	const hasConnections = accepted.length > 0
	const isLoadingGrid = isLoading || isLoadingConnections

	const matchSegments = useMemo(
		() => sharedSegments.filter((segment: TimelineSegmentType) => segment.category === "match"),
		[sharedSegments]
	)

	return (
		<section className="w-full flex flex-col gap-6">
			{/* Header / Legend */}
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-xl font-semibold tracking-tight text-foreground">{t("availability.title")}</h3>
				<div className="flex gap-4 text-xs font-medium">
					<div className="flex items-center gap-1.5">
						<div className="w-3 h-3 bg-[#10b981] rounded-sm" />
						<span className="text-muted-foreground">{t("availability.legendAvailable")}</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-3 h-3 bg-zinc-700 rounded-sm" />
						<span className="text-muted-foreground">{t("availability.legendBusy")}</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-3 h-3 bg-[#8b5cf6] rounded-sm" />
						<span className="text-muted-foreground">{t("availability.legendSleep")}</span>
					</div>
				</div>
			</div>

			<div className={`relative w-full flex flex-col gap-8 transition-opacity duration-300 ${isLoadingGrid ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
				{/* Personal timeline */}
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<UserIcon className="w-4 h-4 text-muted-foreground" />
						<p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
							{t("availability.personalTimeline")}
						</p>
					</div>

					<TimelineBar>
						{personalSegments.length > 0 ? (
							personalSegments.map((segment, idx) => (
								<TimelineSegment
									key={idx}
									start={segment.start}
									end={segment.end}
									category={segment.category}
								/>
							))
						) : (
							// Empty state (full available if no busy/sleep set? Or empty? Assuming empty = available is standard for calendar apps, but here we explicitly show segments. 
							// If no segments, maybe show "No data" or full grey? Let's assume empty for now)
							<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground/30 font-medium">
								{t("availability.noData")}
							</div>
						)}
					</TimelineBar>
				</div>

				{/* Shared timeline */}
				{hasConnections && (
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<SparklesIcon className="w-4 h-4 text-[#10b981]" />
								<p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
									{t("availability.sharedTimeline")}
								</p>
							</div>
							{matchSegments.length > 0 && (
								<span className="text-xs font-bold text-[#10b981]">
									{matchSegments.length} {matchSegments.length === 1 ? t("availability.slot") : t("availability.slots")}
								</span>
							)}
						</div>

						<TimelineBar className="border-[#10b981]/20 bg-[#10b981]/5">
							{matchSegments.length > 0 ? (
								matchSegments.map((segment, idx) => (
									<TimelineSegment
										key={idx}
										start={segment.start}
										end={segment.end}
										category="match" // Force match color (green)
									/>
								))
							) : (
								<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground/30 font-medium">
									{t("availability.noOverlap")}
								</div>
							)}
						</TimelineBar>
					</div>
				)}
			</div>

			{/* List View Placeholder (as seen in design) */}
			<div className="pt-4 border-t border-zinc-800">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<span className="block w-4 h-4 rounded-full border-2 border-muted-foreground/30"></span>
						<h4 className="text-lg font-medium">{t("availability.intervalsList")}</h4>
					</div>
					<button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1 hover:bg-white/90 transition-colors">
						<span className="text-lg leading-none mb-0.5">✓</span>
						{t("common.confirm")}
					</button>
				</div>

				<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 pl-1">
					{t("intervals.categories.sleep")}
				</div>

				{/* List Items Placeholder - rendering current sleep segments */}
				<div className="flex flex-col gap-2">
					{personalSegments.filter(s => s.category === "sleep").map((s, i) => (
						<div key={i} className="border border-zinc-800 bg-zinc-900/50 p-3 flex items-center gap-3 rounded-sm border-l-2 border-l-[#8b5cf6]">
							<code className="text-[#8b5cf6] font-mono font-bold text-sm">{s.start} - {s.end}</code>
							<span className="bg-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">{t("intervals.categories.sleep").toUpperCase()}</span>
						</div>
					))}
					{personalSegments.filter(s => s.category === "sleep").length === 0 && (
						<div className="text-sm text-muted-foreground/50 italic py-2 pl-1">{t("availability.noSleepSet")}</div>
					)}
				</div>
			</div>
		</section>
	)
}

