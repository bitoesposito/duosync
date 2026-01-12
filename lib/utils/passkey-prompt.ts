/**
 * Passkey Prompt Utility
 * 
 * Manages user preference for showing passkey registration prompt
 * Uses localStorage to remember if user dismissed the prompt
 */

const STORAGE_KEY = "duosync_passkey_prompt_dismissed"
const SESSION_STORAGE_KEY = "duosync_passkey_prompt_shown"

/**
 * Check if user has dismissed the passkey prompt permanently
 */
export function hasDismissedPasskeyPrompt(): boolean {
	if (typeof window === "undefined") return false
	return localStorage.getItem(STORAGE_KEY) === "true"
}

/**
 * Mark passkey prompt as dismissed permanently
 */
export function dismissPasskeyPrompt(): void {
	if (typeof window === "undefined") return
	localStorage.setItem(STORAGE_KEY, "true")
}

/**
 * Check if prompt has been shown in this session
 */
export function hasShownPromptThisSession(): boolean {
	if (typeof window === "undefined") return false
	return sessionStorage.getItem(SESSION_STORAGE_KEY) === "true"
}

/**
 * Mark prompt as shown in this session
 */
export function markPromptShown(): void {
	if (typeof window === "undefined") return
	sessionStorage.setItem(SESSION_STORAGE_KEY, "true")
}

/**
 * Reset prompt state (for testing or if user wants to see it again)
 */
export function resetPasskeyPrompt(): void {
	if (typeof window === "undefined") return
	localStorage.removeItem(STORAGE_KEY)
	sessionStorage.removeItem(SESSION_STORAGE_KEY)
}
