/**
 * Intervals Form Component
 * 
 * Improved form with better UX inspired by the old appointments form:
 * - Collapsible on mobile
 * - Better category selector
 * - Improved recurrence with day selection
 * - Description only shown for "other" category
 * - Better styling with separators and uppercase labels
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronDownIcon, ChevronUpIcon, MoonIcon, CalendarIcon, ClockIcon } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useIntervals } from "@/hooks/use-intervals"
import { useAuth } from "@/hooks/use-auth"
import { Loading, ErrorAlert, SuccessAlert } from "@/components/ui"
import { localToUTC } from "@/lib/utils/timezone"
import type { CreateIntervalInput } from "@/store/api/intervalsApi"
import type { RecurrenceRule } from "@/types"

interface FormData {
	date: string // YYYY-MM-DD
	startTime: string // HH:mm
	endTime: string // HH:mm
	category: "sleep" | "busy" | "other"
	description: string
	isRepeating: boolean
	recurrenceType: "daily" | "weekly" | "monthly" | null
	repeatDays: number[] // 1=Monday, 7=Sunday (for weekly)
	recurrenceUntil: string // YYYY-MM-DD or empty
}

const DAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"]
const DAY_IDS = [1, 2, 3, 4, 5, 6, 7]
const WEEKDAYS = [1, 2, 3, 4, 5] // Monday to Friday
const WEEKEND = [6, 7] // Saturday and Sunday
const ALL_WEEK = [1, 2, 3, 4, 5, 6, 7]

export default function IntervalsForm() {
	const { t } = useI18n()
	const { user } = useAuth()
	const { selectedDate, intervals, create, isSaving, refetch } = useIntervals()
	const [isOpen, setIsOpen] = useState(false) // Collapsed on mobile by default
	
	const [formData, setFormData] = useState<FormData>(() => {
		const today = selectedDate || new Date().toISOString().split("T")[0]
		return {
			date: today,
			startTime: "09:00",
			endTime: "17:00",
			category: "other",
			description: "",
			isRepeating: false,
			recurrenceType: null,
			repeatDays: [],
			recurrenceUntil: "",
		}
	})
	
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	// Reset form when date changes
	useEffect(() => {
		if (selectedDate && selectedDate !== formData.date) {
			setFormData((prev) => ({ ...prev, date: selectedDate }))
		}
	}, [selectedDate])

	const handleChange = useCallback((field: keyof FormData, value: string | boolean | number[]) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		setError(null)
	}, [])

	const handleRepeatDaysChange = useCallback((days: number[]) => {
		// Sort days to ensure consistent display
		const sorted = [...days].sort((a, b) => a - b)
		handleChange("repeatDays", sorted)
	}, [handleChange])

	const handlePresetClick = useCallback((type: "daily" | "weekly" | "monthly") => {
		if (type === "daily") {
			handleChange("recurrenceType", "daily")
			handleRepeatDaysChange(ALL_WEEK)
		} else if (type === "weekly") {
			handleChange("recurrenceType", "weekly")
			// For weekly, use the day of the selected date
			const date = new Date(formData.date)
			const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
			handleRepeatDaysChange([dayOfWeek])
		} else if (type === "monthly") {
			handleChange("recurrenceType", "monthly")
			// For monthly, use the day of week from selected date
			const date = new Date(formData.date)
			const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
			handleRepeatDaysChange([dayOfWeek])
		}
	}, [formData.date, handleChange, handleRepeatDaysChange])

	const validateForm = (): string | null => {
		// Validate time format
		const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
		if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
			return t("validation.invalidTime")
		}

		// Validate end is after start (handle next day case)
		const start = new Date(`${formData.date}T${formData.startTime}`)
		const end = new Date(`${formData.date}T${formData.endTime}`)
		
		// Handle case where end time is next day (e.g., 22:00 - 02:00)
		if (formData.endTime <= formData.startTime) {
			end.setDate(end.getDate() + 1)
		}

		if (end <= start) {
			return t("validation.endBeforeStart")
		}

		// Validate duration <= 7 days
		const diffMs = end.getTime() - start.getTime()
		const diffDays = diffMs / (1000 * 60 * 60 * 24)
		if (diffDays > 7) {
			return t("validation.maxDuration")
		}

		// Validate recurrence
		if (formData.isRepeating) {
			if (!formData.recurrenceType) {
				return t("validation.invalidRecurrence")
			}
			if (formData.recurrenceType === "weekly" && formData.repeatDays.length === 0) {
				return t("validation.invalidRecurrence")
			}
		}

		// Validate recurrence until date if set
		if (formData.isRepeating && formData.recurrenceUntil) {
			const untilDate = new Date(`${formData.recurrenceUntil}T00:00:00`)
			const startDate = new Date(formData.date)
			if (untilDate <= startDate) {
				return t("validation.invalidDate")
			}
		}

		return null
	}

	const buildRecurrenceRule = (): RecurrenceRule | null => {
		if (!formData.isRepeating || !formData.recurrenceType) {
			return null
		}

		const rule: RecurrenceRule = {
			type: formData.recurrenceType,
			daysOfWeek: [],
		}

		if (formData.recurrenceType === "daily") {
			rule.daysOfWeek = [1, 2, 3, 4, 5, 6, 7]
		} else if (formData.recurrenceType === "weekly") {
			rule.daysOfWeek = formData.repeatDays.length > 0 ? formData.repeatDays : []
		} else if (formData.recurrenceType === "monthly") {
			// For monthly, use day of week from selected date
			const date = new Date(formData.date)
			const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
			rule.daysOfWeek = [dayOfWeek]
			// Set day of month
			rule.dayOfMonth = date.getDate()
		}

		// Set until date if provided
		if (formData.recurrenceUntil) {
			const untilDate = new Date(formData.recurrenceUntil)
			untilDate.setHours(23, 59, 59, 999)
			rule.until = untilDate.toISOString()
		}

		return rule
	}

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setSuccess(false)

		// Validate form
		const validationError = validateForm()
		if (validationError) {
			setError(validationError)
			return
		}

		if (!user) {
			setError(t("errors.UNAUTHORIZED"))
			return
		}

		try {
			// Convert local time to UTC
			const userTimezone = user.timezone || "UTC"
			const startTs = localToUTC(formData.startTime, formData.date, userTimezone)
			const endTs = localToUTC(formData.endTime, formData.date, userTimezone)
			
			// Handle end time on next day
			if (formData.endTime <= formData.startTime) {
				endTs.setDate(endTs.getDate() + 1)
			}

			// Build input
			const input: CreateIntervalInput = {
				start_ts: startTs.toISOString(),
				end_ts: endTs.toISOString(),
				category: formData.category,
				description: formData.description || null,
				recurrence_rule: buildRecurrenceRule(),
			}

			// Create interval
			await create(input)
			
			// Reset form
			setFormData({
				date: selectedDate || new Date().toISOString().split("T")[0],
				startTime: "09:00",
				endTime: "17:00",
				category: "other",
				description: "",
				isRepeating: false,
				recurrenceType: null,
				repeatDays: [],
				recurrenceUntil: "",
			})

			// Show success
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)

			// Refetch intervals to update list
			refetch()
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err)
			setError(errorMessage)
		}
	}, [formData, user, selectedDate, create, refetch, t])

	return (
		<section className="w-full flex flex-col gap-0 border-b border-border md:border-b-0 bg-background md:bg-transparent">
			{/* Collapsible Header */}
			<header
				className="flex items-center justify-between py-3 md:pt-0 pt-3 md:cursor-default cursor-pointer hover:opacity-70 md:hover:opacity-100 transition-opacity"
				onClick={() => setIsOpen(!isOpen)}
			>
				<h2 className="text-lg font-medium tracking-tight text-foreground">
					{t("form.title")}
				</h2>
				<button
					type="button"
					className="md:hidden text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none h-8 w-8 cursor-pointer flex items-center justify-center"
				>
					{isOpen ? (
						<ChevronUpIcon className="w-4 h-4" />
					) : (
						<ChevronDownIcon className="w-4 h-4" />
					)}
				</button>
			</header>

			{/* Form Content */}
			<div className={`${isOpen ? "block" : "hidden"} md:block`}>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-6 md:pb-0">
					{error && (
						<ErrorAlert error={error} onDismiss={() => setError(null)} />
					)}

					{success && (
						<SuccessAlert
							message={t("common.success")}
							onDismiss={() => setSuccess(false)}
						/>
					)}

					{/* Date */}
					<div className="flex flex-col gap-1">
						<label htmlFor="date" className="text-muted-foreground text-xs font-medium uppercase">
							{t("common.date")}
						</label>
						<input
							id="date"
							type="date"
							value={formData.date}
							onChange={(e) => handleChange("date", e.target.value)}
							className="w-full bg-transparent border-border rounded-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					{/* Start Time */}
					<div className="flex flex-col gap-1">
						<label htmlFor="startTime" className="text-muted-foreground text-xs font-medium uppercase">
							{t("intervals.create.start")}
						</label>
						<input
							id="startTime"
							type="time"
							value={formData.startTime}
							onChange={(e) => handleChange("startTime", e.target.value)}
							className="w-full bg-transparent border-border rounded-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					{/* End Time */}
					<div className="flex flex-col gap-1">
						<label htmlFor="endTime" className="text-muted-foreground text-xs font-medium uppercase">
							{t("intervals.create.end")}
						</label>
						<input
							id="endTime"
							type="time"
							value={formData.endTime}
							onChange={(e) => handleChange("endTime", e.target.value)}
							className="w-full bg-transparent border-border rounded-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							required
						/>
					</div>

					{/* Separator */}
					<div className="border-t border-border" />

					{/* Category Selector */}
					<div className="flex flex-col gap-1">
						<label className="text-muted-foreground text-xs font-medium uppercase">
							{t("intervals.create.category")}
						</label>
						<div className="flex gap-2 border border-border rounded-none p-0.5">
							<button
								type="button"
								onClick={() => handleChange("category", "other")}
								className={`flex-1 gap-2 rounded-none border-none shadow-none h-9 text-sm flex items-center justify-center transition-colors ${
									formData.category === "other"
										? "bg-secondary text-secondary-foreground"
										: "bg-transparent hover:bg-muted"
								}`}
							>
								<CalendarIcon className="w-3.5 h-3.5" />
								{t("intervals.categories.other")}
							</button>
							<button
								type="button"
								onClick={() => handleChange("category", "busy")}
								className={`flex-1 gap-2 rounded-none border-none shadow-none h-9 text-sm flex items-center justify-center transition-colors ${
									formData.category === "busy"
										? "bg-secondary text-secondary-foreground"
										: "bg-transparent hover:bg-muted"
								}`}
							>
								<ClockIcon className="w-3.5 h-3.5" />
								{t("intervals.categories.busy")}
							</button>
							<button
								type="button"
								onClick={() => handleChange("category", "sleep")}
								className={`flex-1 gap-2 rounded-none border-none shadow-none h-9 text-sm flex items-center justify-center transition-colors ${
									formData.category === "sleep"
										? "bg-secondary text-secondary-foreground"
										: "bg-transparent hover:bg-muted"
								}`}
							>
								<MoonIcon className="w-3.5 h-3.5" />
								{t("intervals.categories.sleep")}
							</button>
						</div>
					</div>

					{/* Description - only for "other" category */}
					{formData.category === "other" && (
						<div className="flex flex-col gap-1">
							<label htmlFor="description" className="text-muted-foreground text-xs font-medium uppercase">
								{t("intervals.create.description")}
							</label>
							<input
								id="description"
								type="text"
								value={formData.description}
								onChange={(e) => handleChange("description", e.target.value)}
								placeholder={t("intervals.create.description")}
								className="w-full bg-transparent border-border rounded-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					)}

					{/* Separator */}
					<div className="border-t border-border" />

					{/* Recurrence Section */}
					<div className="flex flex-col gap-0 pt-1">
						<button
							type="button"
							onClick={() => handleChange("isRepeating", !formData.isRepeating)}
							className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70 transition-opacity"
						>
							<label className="cursor-pointer text-muted-foreground text-xs font-medium uppercase pointer-events-none">
								{t("intervals.create.recurrence")}
							</label>
							{formData.isRepeating ? (
								<ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
							) : (
								<ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
							)}
						</button>

						{/* Recurrence Content */}
						<div
							className={`overflow-hidden transition-all duration-200 ease-in-out ${
								formData.isRepeating ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
							}`}
						>
							<div className="flex flex-col gap-2 pt-1 pb-2">
								{/* Quick Selection Presets */}
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => handlePresetClick("daily")}
										className={`flex-1 h-7 text-xs rounded-none border border-border transition-colors ${
											formData.recurrenceType === "daily"
												? "bg-secondary text-secondary-foreground"
												: "bg-transparent hover:bg-muted"
										}`}
									>
										{t("intervals.recurrence.daily")}
									</button>
									<button
										type="button"
										onClick={() => handlePresetClick("weekly")}
										className={`flex-1 h-7 text-xs rounded-none border border-border transition-colors ${
											formData.recurrenceType === "weekly"
												? "bg-secondary text-secondary-foreground"
												: "bg-transparent hover:bg-muted"
										}`}
									>
										{t("intervals.recurrence.weekly")}
									</button>
									<button
										type="button"
										onClick={() => handlePresetClick("monthly")}
										className={`flex-1 h-7 text-xs rounded-none border border-border transition-colors ${
											formData.recurrenceType === "monthly"
												? "bg-secondary text-secondary-foreground"
												: "bg-transparent hover:bg-muted"
										}`}
									>
										{t("intervals.recurrence.monthly")}
									</button>
								</div>

								{/* Day Selection Toggle Group - only for weekly */}
								{formData.recurrenceType === "weekly" && (
									<div className="flex gap-px bg-border border border-border">
										{DAY_IDS.map((day, i) => (
											<button
												key={day}
												type="button"
												onClick={() => {
													const newDays = formData.repeatDays.includes(day)
														? formData.repeatDays.filter((d) => d !== day)
														: [...formData.repeatDays, day]
													handleRepeatDaysChange(newDays)
												}}
												className={`flex-1 h-8 rounded-none text-xs transition-colors ${
													formData.repeatDays.includes(day)
														? "bg-foreground text-background"
														: "bg-background text-muted-foreground hover:bg-muted"
												}`}
											>
												{DAY_LABELS[i]}
											</button>
										))}
									</div>
								)}

								{/* Info for monthly */}
								{formData.recurrenceType === "monthly" && (
									<div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
										{t("intervals.recurrence.monthly")}: {new Date(formData.date).getDate()} {t("intervals.recurrence.ofEachMonth") || "di ogni mese"}
									</div>
								)}

								{/* Recurrence Until */}
								<div className="flex flex-col gap-1">
									<label htmlFor="recurrenceUntil" className="text-muted-foreground text-xs font-medium uppercase">
										{t("intervals.recurrence.until")} <span className="normal-case">({t("common.optional")})</span>
									</label>
									<input
										id="recurrenceUntil"
										type="date"
										value={formData.recurrenceUntil}
										onChange={(e) => handleChange("recurrenceUntil", e.target.value)}
										min={formData.date}
										className="w-full bg-transparent border-border rounded-none h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSaving || !user}
						className="w-full cursor-pointer font-medium tracking-wide h-10 rounded-none text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						{isSaving ? (
							<>
								<Loading size="sm" />
								{t("common.loading")}
							</>
						) : (
							t("form.submit")
						)}
					</button>

					{!user && (
						<div className="bg-muted border border-border p-3 rounded-none text-sm text-muted-foreground">
							{t("errors.UNAUTHORIZED")}
						</div>
					)}
				</form>
			</div>
		</section>
	)
}
