/**
 * Intervals List Component
 * 
 * Displays list of intervals for the selected date:
 * - Shows intervals from useIntervals()
 * - Displays time range, category, description
 * - Shows recurrence info if present
 * - Delete action (edit will be added later)
 */

"use client"

import { useState, useMemo } from "react"
import { useI18n } from "@/hooks/use-i18n"
import { useIntervals } from "@/hooks/use-intervals"
import { useAuth } from "@/hooks/use-auth"
import { Loading, ErrorAlert } from "@/components/ui"
import { formatTimeInTimezone } from "@/lib/utils/timezone"
import { formatRecurrenceRuleShort } from "@/lib/utils/recurrence"
import { Trash2Icon } from "lucide-react"

export default function IntervalsList() {
	const { t } = useI18n()
	const { user } = useAuth()
	const { intervals, isLoading, error, remove, isSaving } = useIntervals()
	const [deletingId, setDeletingId] = useState<number | null>(null)

	const userTimezone = user?.timezone || "UTC"

	// Group intervals by category
	const groupedIntervals = useMemo(() => {
		const groups: Record<"sleep" | "busy" | "other", typeof intervals> = {
			sleep: [],
			busy: [],
			other: [],
		}

		intervals.forEach((interval) => {
			groups[interval.category].push(interval)
		})

		return groups
	}, [intervals])

	const handleDelete = async (id: number) => {
		if (!confirm(t("intervals.delete.confirm"))) {
			return
		}

		setDeletingId(id)
		try {
			await remove(id)
		} catch (err) {
			console.error("Delete error:", err)
			// Error will be shown via error state
		} finally {
			setDeletingId(null)
		}
	}

	if (isLoading) {
		return (
			<section className="w-full flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">{t("intervals.title")}</h3>
				</div>
				<div className="p-8 text-center">
					<Loading size="md" text={t("common.loading")} />
				</div>
			</section>
		)
	}

	if (error) {
		return (
			<section className="w-full flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">{t("intervals.title")}</h3>
				</div>
				<ErrorAlert
					error={error instanceof Error ? error.message : String(error)}
					onDismiss={() => {}}
				/>
			</section>
		)
	}

	const totalIntervals = intervals.length
	if (totalIntervals === 0) {
		return (
			<section className="w-full flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">{t("intervals.title")}</h3>
				</div>
				<div className="p-8 text-center text-muted-foreground rounded-lg border border-border">
					<p className="text-sm">{t("timeline.empty")}</p>
				</div>
			</section>
		)
	}

	return (
		<section className="w-full flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">{t("intervals.title")}</h3>
				<span className="text-sm text-muted-foreground">
					{totalIntervals} {totalIntervals === 1 ? "interval" : "intervals"}
				</span>
			</div>

			<div className="space-y-6">
				{/* Sleep Intervals */}
				{groupedIntervals.sleep.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-muted-foreground mb-2">
							{t("intervals.categories.sleep")}
						</h4>
						<div className="space-y-2">
							{groupedIntervals.sleep.map((interval) => (
								<IntervalItem
									key={interval.id}
									interval={interval}
									userTimezone={userTimezone}
									onDelete={handleDelete}
									deleting={deletingId === interval.id}
									t={t}
								/>
							))}
						</div>
					</div>
				)}

				{/* Busy Intervals */}
				{groupedIntervals.busy.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-muted-foreground mb-2">
							{t("intervals.categories.busy")}
						</h4>
						<div className="space-y-2">
							{groupedIntervals.busy.map((interval) => (
								<IntervalItem
									key={interval.id}
									interval={interval}
									userTimezone={userTimezone}
									onDelete={handleDelete}
									deleting={deletingId === interval.id}
									t={t}
								/>
							))}
						</div>
					</div>
				)}

				{/* Other Intervals */}
				{groupedIntervals.other.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-muted-foreground mb-2">
							{t("intervals.categories.other")}
						</h4>
						<div className="space-y-2">
							{groupedIntervals.other.map((interval) => (
								<IntervalItem
									key={interval.id}
									interval={interval}
									userTimezone={userTimezone}
									onDelete={handleDelete}
									deleting={deletingId === interval.id}
									t={t}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	)
}

/**
 * Individual interval item component
 */
function IntervalItem({
	interval,
	userTimezone,
	onDelete,
	deleting,
	t,
}: {
	interval: {
		id: number
		startTs: Date | string
		endTs: Date | string
		category: "sleep" | "busy" | "other"
		description?: string | null
		recurrenceRule?: any
	}
	userTimezone: string
	onDelete: (id: number) => void
	deleting: boolean
	t: (key: string) => string
}) {
	const startTime = formatTimeInTimezone(interval.startTs, userTimezone)
	const endTime = formatTimeInTimezone(interval.endTs, userTimezone)

	// Handle next day case (e.g., 22:00 - 02:00)
	const startDate = new Date(interval.startTs)
	const endDate = new Date(interval.endTs)
	const isNextDay = endDate.getDate() !== startDate.getDate()

	return (
		<div className="rounded-lg border border-input bg-card p-4 flex items-start justify-between gap-4">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<span className="text-sm font-medium">
						{startTime} - {endTime}
						{isNextDay && <span className="text-muted-foreground ml-1">(+1)</span>}
					</span>
					{interval.recurrenceRule && (
						<span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
							{formatRecurrenceRuleShort(interval.recurrenceRule, "en")}
						</span>
					)}
				</div>
				{interval.description && (
					<p className="text-sm text-muted-foreground">{interval.description}</p>
				)}
			</div>
			<button
				onClick={() => onDelete(interval.id)}
				disabled={deleting}
				className="flex-shrink-0 p-2 rounded-md hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				title={t("intervals.delete.title")}
			>
				{deleting ? (
					<Loading size="sm" />
				) : (
					<Trash2Icon className="w-4 h-4" />
				)}
			</button>
		</div>
	)
}
