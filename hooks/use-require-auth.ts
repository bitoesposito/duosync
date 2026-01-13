/**
 * useRequireAuth Hook
 * 
 * Redirects to login if user is not authenticated
 * Returns loading state while checking authentication
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./use-auth"

export function useRequireAuth() {
	const router = useRouter()
	const { authenticated, loading } = useAuth()

	useEffect(() => {
		if (!loading && !authenticated) {
			router.push("/login")
		}
	}, [loading, authenticated, router])

	return { loading, authenticated }
}

