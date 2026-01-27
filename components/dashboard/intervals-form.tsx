/**
 * Intervals Form Component
 * 
 * Form for creating intervals with:
 * - Collapsible on mobile
 * - Smart start time auto-fill
 * - Direct save (no draft mode)
 * - Separated concerns via sub-components
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon, CheckIcon } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useIntervals } from "@/hooks/use-intervals"
import { useAuth } from "@/hooks/use-auth"
import { localToUTC } from "@/lib/utils/timezone"
import type { CreateIntervalInput } from "@/store/api/intervalsApi"
import type { RecurrenceRule } from "@/types"
import { TimeInputs } from "./form/time-inputs"
import { CategorySelector, type Category } from "./form/category-selector"
import { RecurrenceSection } from "./form/recurrence"
import { findFirstAvailableSlot } from "@/lib/services/slot-finder.service"
import { cn } from "@/lib/utils"

interface FormData {
	date: string // YYYY-MM-DD
	startTime: string // HH:mm
	endTime: string // HH:mm
	category: Category
	description: string
	isRepeating: boolean
	recurrenceType: "daily" | "weekly" | null
	repeatDays: number[] // 1=Monday, 7=Sunday (for weekly)
	recurrenceUntil: string // YYYY-MM-DD or empty
}

const ALL_WEEK = [1, 2, 3, 4, 5, 6, 7]

export default function IntervalsForm() {
	const { t } = useI18n()
	const { user } = useAuth()
	const { selectedDate, intervals, create, isSaving, refetch, isLoading, setDate } = useIntervals()
	const [isOpen, setIsOpen] = useState(false)

	const [formData, setFormData] = useState<FormData>(() => {
		const today = selectedDate || new Date().toISOString().split("T")[0]
		return {
			date: today,
			startTime: "",
			endTime: "",
			category: "busy",
			description: "",
			isRepeating: false,
			recurrenceType: null,
			repeatDays: [],
			recurrenceUntil: "",
		}
	})

	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [hasUserEditedTimes, setHasUserEditedTimes] = useState(false)
	const [isValid, setIsValid] = useState(false)

	// Sync form date with global selected date
	useEffect(() => {
		if (selectedDate && selectedDate !== formData.date) {
			setFormData((prev) => ({
				...prev,
				date: selectedDate,
				// Reset times on date change
				startTime: "",
				endTime: "",
			}))
			setHasUserEditedTimes(false)
		}
	}, [selectedDate])

	// Smart Time Auto-fill
	useEffect(() => {
		if (user && !isLoading && !formData.startTime && !hasUserEditedTimes && intervals) {
			const firstSlot = findFirstAvailableSlot(
				intervals,
				formData.date,
				user.timezone || "UTC"
			)

			if (firstSlot) {
				const [h, m] = firstSlot.split(":").map(Number)
				const endH = (h + 1) % 24
				const endSlot = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`

				setFormData(prev => ({
					...prev,
					startTime: firstSlot,
					endTime: endSlot
				}))
			} else {
				setFormData(prev => ({ ...prev, startTime: "09:00", endTime: "10:00" }))
			}
		}
	}, [user, isLoading, hasUserEditedTimes, intervals, formData.date, formData.startTime])

	const handleChange = useCallback((field: keyof FormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		setError(null)
	}, [])

	const handleDateChange = (date: string) => {
		handleChange("date", date)
		setDate(date) // Update global context to fetch intervals for overlap check
	}

	const handleTimeChange = (type: "startTime" | "endTime", value: string) => {
		handleChange(type, value)
		setHasUserEditedTimes(true)
	}

	const handleRecurrenceTypeChange = useCallback((type: "daily" | "weekly") => {
		handleChange("recurrenceType", type)
		if (type === "daily") {
			handleChange("repeatDays", ALL_WEEK)
		} else if (type === "weekly") {
			const date = new Date(formData.date)
			const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
			handleChange("repeatDays", [dayOfWeek])
		}
	}, [formData.date, handleChange])

	const validateForm = (data: FormData): string | null => {
		const start = new Date(`${data.date}T${data.startTime}`)
		const end = new Date(`${data.date}T${data.endTime}`)

		if (data.endTime <= data.startTime) {
			end.setDate(end.getDate() + 1)
		}

		if (end <= start) return t("validation.endBeforeStart")

		const diffMs = end.getTime() - start.getTime()
		if (diffMs > 24 * 60 * 60 * 1000) return t("validation.maxDuration")

		if (data.isRepeating) {
			if (!data.recurrenceType) return t("form.selectRecurrenceType")
			if (data.recurrenceType === "weekly" && data.repeatDays.length === 0) {
				return t("form.selectAtLeastOneDay")
			}
			if (data.recurrenceUntil) {
				if (data.recurrenceUntil <= data.date) return t("form.untilDateMustBeFuture")
			}
		}

		return null
	}

	const buildRecurrenceRule = (data: FormData): RecurrenceRule | null => {
		if (!data.isRepeating || !data.recurrenceType) return null

		const rule: RecurrenceRule = {
			type: data.recurrenceType,
			daysOfWeek: [],
		}

		if (data.recurrenceType === "daily") {
			rule.daysOfWeek = [1, 2, 3, 4, 5, 6, 7]
		} else if (data.recurrenceType === "weekly") {
			rule.daysOfWeek = data.repeatDays
		}

		if (data.recurrenceUntil) {
			const untilDate = new Date(data.recurrenceUntil)
			untilDate.setHours(23, 59, 59, 999)
			rule.until = untilDate.toISOString()
		}

		return rule
	}

	const resetForm = () => {
		setFormData(prev => ({
			...prev,
			category: "busy",
			description: "",
			isRepeating: false,
			recurrenceType: null,
			repeatDays: [],
			recurrenceUntil: "",
			startTime: "",
			endTime: "",
		}))
		setHasUserEditedTimes(false)
	}

	const handleSave = async () => {
		setError(null)
		setSuccess(false)

		if (!user) {
			setError("Unauthorized")
			return
		}

		const err = validateForm(formData)
		if (err) {
			setError(err)
			return
		}

		try {
			const userTimezone = user.timezone || "UTC"
			const startTs = localToUTC(formData.startTime, formData.date, userTimezone)
			const endTs = localToUTC(formData.endTime, formData.date, userTimezone)

			if (formData.endTime <= formData.startTime) {
				endTs.setDate(endTs.getDate() + 1)
			}

			const input: CreateIntervalInput = {
				start_ts: startTs.toISOString(),
				end_ts: endTs.toISOString(),
				category: formData.category,
				description: formData.description || null,
				recurrence_rule: buildRecurrenceRule(formData),
			}

			await create(input)

			resetForm()
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
			refetch()
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err)
			setError(errorMessage)
		}
	}

	return (
		<section className="w-full flex flex-col bg-background/50 md:bg-transparent border-b border-border md:border-b-0 space-y-4">
			{/* Header */}
			<header
				className="flex items-center justify-between md:pt-0 pt-2 md:cursor-default cursor-pointer group md:px-0"
				onClick={() => setIsOpen(!isOpen)}
			>
				<h2 className="text-xs font-semibold tracking-tight uppercase text-foreground/80 group-hover:text-foreground transition-colors">
					{t("form.addInterval")}
				</h2>
				<button
					type="button"
					className="md:hidden text-muted-foreground hover:text-foreground p-1"
				>
					{isOpen ? <ChevronUpIcon className="w-4 h-4 cursor-pointer" /> : <ChevronDownIcon className="w-4 h-4 cursor-pointer" />}
				</button>
			</header>

			{/* Form Content */}
			<div className={cn(
				"md:block overflow-hidden transition-all duration-300 ease-in-out",
				isOpen ? "max-h-[2000px] opacity-100 pb-4" : "max-h-0 opacity-0 md:max-h-none md:opacity-100 md:pb-0"
			)}>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-3">
						<TimeInputs
							startTime={formData.startTime}
							endTime={formData.endTime}
							date={formData.date}
							onStartTimeChange={(v) => handleTimeChange("startTime", v)}
							onEndTimeChange={(v) => handleTimeChange("endTime", v)}
							onDateChange={handleDateChange} // New
							disabled={isSaving || !user}
							existingIntervals={intervals || []}
							onValidationChange={setIsValid}
						/>

						<CategorySelector
							selectedCategory={formData.category}
							onCategoryChange={(c) => handleChange("category", c)}
							disabled={isSaving || !user}
						/>

						{formData.category === "other" && (
							<div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
								<input
									id="description"
									type="text"
									value={formData.description}
									onChange={(e) => handleChange("description", e.target.value)}
									placeholder={t("intervals.create.descriptionPlaceholder")}
									className="w-full bg-background/50 border border-input rounded-md h-8 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
								/>
							</div>
						)}

						<RecurrenceSection
							isRepeating={formData.isRepeating}
							recurrenceType={formData.recurrenceType}
							repeatDays={formData.repeatDays}
							recurrenceUntil={formData.recurrenceUntil}
							date={formData.date}
							onRepeatingChange={(v) => handleChange("isRepeating", v)}
							onRecurrenceTypeChange={handleRecurrenceTypeChange}
							onRepeatDaysChange={(v) => handleChange("repeatDays", v)}
							onRecurrenceUntilChange={(v) => handleChange("recurrenceUntil", v)}
							disabled={isSaving || !user}
						/>
					</div>

					{/* Actions */}
					<div className="flex flex-col gap-1.5 pt-1">
						{/* Confirm Button */}
						<button
							type="button"
							onClick={handleSave}
							disabled={isSaving || !user || !isValid}
							className="w-full h-8 text-xs font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-all rounded-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSaving ? (
								<>
									<Loader2Icon className="w-3 h-3 animate-spin" />
									<span>{t("form.saving")}</span>
								</>
							) : (
								t("common.confirm")
							)}
						</button>
					</div>

					{!user && (
						<p className="text-[10px] text-muted-foreground text-center">{t("form.loginRequired")}</p>
					)}

					{error && (
						<div className="bg-destructive/10 text-destructive text-[10px] p-2 border border-destructive/20">
							{error}
						</div>
					)}

					{success && (
						<div className="bg-emerald-500/10 text-emerald-500 text-[10px] p-2 border border-emerald-500/20 flex items-center gap-2">
							<CheckIcon className="w-3 h-3" /> {t("form.intervalsSaved")}
						</div>
					)}
				</div>
			</div>
		</section>
	)
}
