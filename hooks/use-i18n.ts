/**
 * useI18n Hook
 * 
 * Simplified i18n hook for client components
 * Uses localStorage to persist locale preference
 */

import { useState, useEffect, useMemo } from "react"
import enMessages from "@/i18n/en.json"
import itMessages from "@/i18n/it.json"

type Messages = typeof enMessages

const messages: Record<string, Messages> = {
	en: enMessages,
	it: itMessages,
}

export function useI18n() {
	// Start with "en" to match server-side rendering
	const [locale, setLocaleState] = useState<string>("en")
	const [isClient, setIsClient] = useState(false)

	// Only read from localStorage on client after mount
	useEffect(() => {
		setIsClient(true)
		const storedLocale = localStorage.getItem("locale") || "en"
		setLocaleState(storedLocale)
	}, [])

	const t = useMemo(() => {
		// Use "en" during SSR and initial render to avoid hydration mismatch
		const currentLocale = isClient ? locale : "en"
		const localeMessages = messages[currentLocale] || messages.en

		return (key: string, params?: Record<string, string | number>) => {
			const keys = key.split(".")
			let value: any = localeMessages

			// Navigate through nested keys
			for (const k of keys) {
				if (value && typeof value === "object" && k in value) {
					value = value[k as keyof typeof value]
				} else {
					// Fallback to English if key not found in current locale
					value = messages.en
					for (const fallbackKey of keys) {
						if (value && typeof value === "object" && fallbackKey in value) {
							value = value[fallbackKey as keyof typeof value]
						} else {
							// Key not found in either locale, return key as-is
							return key
						}
					}
					break
				}
			}

			if (typeof value !== "string") {
				return key
			}

			// Replace params (e.g., {name} -> actual name)
			if (params) {
				return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
					return params[paramKey]?.toString() || match
				})
			}

			return value
		}
	}, [locale, isClient])

	const setLocale = (newLocale: string) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("locale", newLocale)
			window.location.reload()
		}
	}

	return { t, locale, setLocale }
}
