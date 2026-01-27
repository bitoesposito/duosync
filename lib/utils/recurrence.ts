/**
 * Recurrence Utilities
 * 
 * Functions for formatting and displaying recurrence rules
 */

import type { RecurrenceRule } from "@/types"

const DAY_NAMES = {
	1: "Lunedì",
	2: "Martedì",
	3: "Mercoledì",
	4: "Giovedì",
	5: "Venerdì",
	6: "Sabato",
	7: "Domenica",
} as const

const DAY_NAMES_EN = {
	1: "Monday",
	2: "Tuesday",
	3: "Wednesday",
	4: "Thursday",
	5: "Friday",
	6: "Saturday",
	7: "Sunday",
} as const

/**
 * Format recurrence rule for display
 * 
 * @param rule - Recurrence rule
 * @param locale - Locale for formatting ("it" | "en")
 * @returns Formatted string
 */
export function formatRecurrenceRule(
	rule: RecurrenceRule,
	locale: "it" | "en" = "it"
): string {
	const dayNames = locale === "it" ? DAY_NAMES : DAY_NAMES_EN

	// Format days of week
	const days = rule.daysOfWeek
		.map((day) => dayNames[day as keyof typeof dayNames])
		.join(", ")

	// Format type
	let typeStr = ""
	if (rule.type === "weekly") {
		typeStr = locale === "it" ? "Settimanale" : "Weekly"
	} else if (rule.type === "daily") {
		typeStr = locale === "it" ? "Giornaliera" : "Daily"
	}

	// Format until date
	if (rule.until) {
		const untilDate = new Date(rule.until).toLocaleDateString(locale === "it" ? "it-IT" : "en-US")
		return `${typeStr} - ${days} (fino al ${untilDate})`
	}

	return `${typeStr} - ${days}`
}

/**
 * Format recurrence rule as short string (for list items)
 * 
 * @param rule - Recurrence rule
 * @param locale - Locale for formatting
 * @returns Short formatted string
 */
export function formatRecurrenceRuleShort(
	rule: RecurrenceRule,
	locale: "it" | "en" = "it"
): string {
	const dayNames = locale === "it" ? DAY_NAMES : DAY_NAMES_EN

	// Format days of week (abbreviated)
	const dayAbbr = locale === "it" 
		? ["L", "M", "M", "G", "V", "S", "D"]
		: ["M", "T", "W", "T", "F", "S", "S"]
	
	const days = rule.daysOfWeek
		.map((day) => dayAbbr[day - 1])
		.join("")

	// Format type (abbreviated)
	let typeStr = ""
	if (rule.type === "weekly") {
		typeStr = locale === "it" ? "Sett." : "Wk"
	} else if (rule.type === "daily") {
		typeStr = locale === "it" ? "Giorn." : "Day"
	}

	return `${typeStr} ${days}`
}

