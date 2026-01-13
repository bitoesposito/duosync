/**
 * usePasskeyPrompt Hook
 * 
 * Manages passkey prompt visibility based on:
 * - User has no passkeys
 * - User preferences (dismissed permanently)
 * - Session state (already shown this session)
 * - URL parameter (force show)
 */

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "./use-auth"
import {
	hasDismissedPasskeyPrompt,
	dismissPasskeyPrompt,
	hasShownPromptThisSession,
	markPromptShown,
} from "@/lib/utils/passkey-prompt"

export function usePasskeyPrompt() {
	const searchParams = useSearchParams()
	const { user, hasPasskeys, loading } = useAuth()
	const [showPrompt, setShowPrompt] = useState(false)

	useEffect(() => {
		if (!user || hasPasskeys || loading) return

		const promptPasskey = searchParams.get("promptPasskey")

		// Always show if explicitly requested via URL parameter
		if (promptPasskey === "true") {
			setShowPrompt(true)
			markPromptShown()
			return
		}

		// Don't show if user dismissed it permanently or already shown this session
		if (hasDismissedPasskeyPrompt() || hasShownPromptThisSession()) {
			return
		}

		// Show prompt if user has no passkeys
		setShowPrompt(true)
		markPromptShown()
	}, [searchParams, user, hasPasskeys, loading])

	const handleDismiss = () => {
		setShowPrompt(false)
		dismissPasskeyPrompt()
	}

	return {
		showPrompt,
		setShowPrompt,
		dismissPrompt: handleDismiss,
	}
}

