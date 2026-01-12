/**
 * i18n Routing Configuration
 * 
 * Defines available locales and default locale
 */

import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
	// A list of all locales that are supported
	locales: ["en", "it"],

	// Used when no locale matches
	defaultLocale: "en",
})
