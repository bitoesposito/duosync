/**
 * useI18n Hook
 * 
 * Simplified i18n hook for client components
 * Uses localStorage to persist locale preference
 */

import { useMemo } from "react"
import enMessages from "@/i18n/en.json"
import itMessages from "@/i18n/it.json"

type Messages = typeof enMessages

const messages: Record<string, Messages> = {
	en: enMessages,
	it: itMessages,
}

export function useI18n() {
	const locale = useMemo(() => {
		if (typeof window === "undefined") return "en"
		return localStorage.getItem("locale") || "en"
	}, [])

	const t = useMemo(() => {
		const localeMessages = messages[locale] || messages.en

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
	}, [locale])

	const setLocale = (newLocale: string) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("locale", newLocale)
			window.location.reload()
		}
	}

	return { t, locale, setLocale }
}
