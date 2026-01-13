/**
 * Intervals Form Component
 * 
 * Improved form with better UX:
 * - Collapsible on mobile
 * - Drafting Mode (Batch Creation)
 * - Smart start time auto-fill
 * - Separated concerns via sub-components
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon, PlusIcon, CheckIcon, SaveIcon, Trash2Icon } from "lucide-react"
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
	recurrenceType: "daily" | "weekly" | "monthly" | null
	repeatDays: number[] // 1=Monday, 7=Sunday (for weekly)
	recurrenceUntil: string // YYYY-MM-DD or empty
}

const ALL_WEEK = [1, 2, 3, 4, 5, 6, 7]

export default function IntervalsForm() {
	const { t } = useI18n()
	const { user } = useAuth()
	const { selectedDate, intervals, create, isSaving, refetch, isLoading, setDate } = useIntervals()
	const [isOpen, setIsOpen] = useState(false)

	const [drafts, setDrafts] = useState<FormData[]>([])

	const [formData, setFormData] = useState<FormData>(() => {
		const today = selectedDate || new Date().toISOString().split("T")[0]
		return {
			date: today,
			startTime: "",
			endTime: "",
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

	const handleRecurrenceTypeChange = useCallback((type: "daily" | "weekly" | "monthly") => {
		handleChange("recurrenceType", type)
		if (type === "daily") {
			handleChange("repeatDays", ALL_WEEK)
		} else if (type === "weekly") {
			const date = new Date(formData.date)
			const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
			handleChange("repeatDays", [dayOfWeek])
		} else if (type === "monthly") {
			handleChange("repeatDays", [])
		}
	}, [formData.date, handleChange])

	const validateForm = (data: FormData): string | null => {
		const start = new Date(`${data.date}T${data.startTime}`)
		const end = new Date(`${data.date}T${data.endTime}`)

		if (data.endTime <= data.startTime) {
			end.setDate(end.getDate() + 1)
		}

		if (end <= start) return "End time must be after start time"

		const diffMs = end.getTime() - start.getTime()
		if (diffMs > 7 * 24 * 60 * 60 * 1000) return "Duration too long"

		if (data.isRepeating) {
			if (!data.recurrenceType) return "Select recurrence type"
			if (data.recurrenceType === "weekly" && data.repeatDays.length === 0) {
				return "Select at least one day"
			}
			if (data.recurrenceUntil) {
				if (data.recurrenceUntil <= data.date) return "Until date must be in future"
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
		} else if (data.recurrenceType === "monthly") {
			const date = new Date(data.date)
			const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
			rule.daysOfWeek = [dayOfWeek]
			rule.dayOfMonth = date.getDate()
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
			category: "other",
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

	const handleAddDraft = (e: React.MouseEvent) => {
		e.preventDefault()
		const validationError = validateForm(formData)
		if (validationError) {
			setError(validationError)
			return
		}

		setDrafts(prev => [...prev, formData])
		resetForm()
	}

	const removeDraft = (index: number) => {
		setDrafts(prev => prev.filter((_, i) => i !== index))
	}

	const handleSaveAll = async () => {
		setError(null)
		setSuccess(false)

		if (!user) {
			setError("Unauthorized")
			return
		}

		const itemsToSave = drafts.length > 0 ? drafts : [formData]

		// Validate all if saving drafts, or single if saving form direct
		if (drafts.length === 0) {
			const err = validateForm(formData)
			if (err) {
				setError(err)
				return
			}
		}

		try {
			const userTimezone = user.timezone || "UTC"

			// Process sequentially to ensure order/consistency
			for (const item of itemsToSave) {
				const startTs = localToUTC(item.startTime, item.date, userTimezone)
				const endTs = localToUTC(item.endTime, item.date, userTimezone)

				if (item.endTime <= item.startTime) {
					endTs.setDate(endTs.getDate() + 1)
				}

				const input: CreateIntervalInput = {
					start_ts: startTs.toISOString(),
					end_ts: endTs.toISOString(),
					category: item.category,
					description: item.description || null,
					recurrence_rule: buildRecurrenceRule(item),
				}

				await create(input)
			}

			setDrafts([])
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
				className="flex items-center justify-between py-2 md:pt-0 pt-2 md:cursor-default cursor-pointer group px-4 md:px-0"
				onClick={() => setIsOpen(!isOpen)}
			>
				<h2 className="text-xs font-semibold tracking-tight uppercase text-foreground/80 group-hover:text-foreground transition-colors">
					Add Interval
				</h2>
				<button
					type="button"
					className="md:hidden text-muted-foreground hover:text-foreground p-1"
				>
					{isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
				</button>
			</header>

			{/* Form Content */}
			<div className={cn(
				"md:block overflow-hidden transition-all duration-300 ease-in-out px-4 md:px-0",
				isOpen ? "max-h-[2000px] opacity-100 pb-4" : "max-h-0 opacity-0 md:max-h-none md:opacity-100 md:pb-0"
			)}>
				<div className="flex flex-col gap-3">
					{error && (
						<div className="bg-destructive/10 text-destructive text-[10px] p-2 border border-destructive/20">
							{error}
						</div>
					)}

					{success && (
						<div className="bg-emerald-500/10 text-emerald-500 text-[10px] p-2 border border-emerald-500/20 flex items-center gap-2">
							<CheckIcon className="w-3 h-3" /> Intervals saved
						</div>
					)}

					{/* Drafts List */}
					{drafts.length > 0 && (
						<div className="flex flex-col gap-1 mb-1 p-2 bg-muted/20 rounded-md border border-border/50">
							<div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Review List ({drafts.length})</div>
							{drafts.map((draft, idx) => (
								<div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-background border border-border rounded-sm">
									<div className="flex flex-col leading-tight">
										<span className="font-medium">{draft.startTime} - {draft.endTime}</span>
										<span className="text-[10px] text-muted-foreground flex items-center gap-1.5 capitalize">
											<span className={cn(
												"w-1.5 h-1.5 rounded-full",
												draft.category === 'busy' && "bg-zinc-500",
												draft.category === 'sleep' && "bg-purple-500",
												draft.category === 'other' && "bg-zinc-700"
											)} />
											{draft.category} {draft.isRepeating && "(Recurring)"}
										</span>
									</div>
									<button
										onClick={() => removeDraft(idx)}
										className="text-muted-foreground hover:text-destructive p-1"
									>
										<Trash2Icon className="w-3 h-3" />
									</button>
								</div>
							))}
						</div>
					)}

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
									placeholder="Add description..."
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
						{/* Add to List Button */}
						<button
							type="button"
							onClick={handleAddDraft}
							disabled={isSaving || !user || !isValid}
							className="w-full h-8 text-xs font-medium uppercase tracking-wide bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center gap-2 transition-all rounded-sm"
						>
							<PlusIcon className="w-3 h-3" />
							<span>Add to List</span>
						</button>

						{/* Confirm / Save Button */}
						<button
							type="button"
							onClick={handleSaveAll}
							disabled={isSaving || !user || (drafts.length === 0 && !isValid)}
							className={cn(
								"w-full h-8 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all rounded-sm shadow-sm",
								drafts.length > 0
									? "bg-primary text-primary-foreground hover:bg-primary/90" // Primary action if drafts exist
									: "bg-background border border-primary/20 text-muted-foreground hover:text-foreground hover:border-primary/50" // Subtler if empty
							)}
						>
							{isSaving ? (
								<>
									<Loader2Icon className="w-3 h-3 animate-spin" />
									<span>Saving...</span>
								</>
							) : (
								<>
									<SaveIcon className="w-3 h-3" />
									<span>{drafts.length > 0 ? `Confirm All (${drafts.length})` : "Confirm & Save"}</span>
								</>
							)}
						</button>
					</div>

					{!user && (
						<p className="text-[10px] text-muted-foreground text-center">Login required</p>
					)}
				</div>
			</div>
		</section>
	)
}
