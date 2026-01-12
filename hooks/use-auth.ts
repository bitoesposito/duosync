/**
 * useAuth Hook
 * 
 * Public API hook for authentication state
 * Wraps Redux auth slice and RTK Query
 */

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useCheckAuthQuery, useLogoutMutation } from "@/store/api/authApi"
import { setUser, setHasPasskeys, setLoading, logout as logoutAction } from "@/store/slices/authSlice"

export function useAuth() {
	const dispatch = useAppDispatch()
	const { user, authenticated, hasPasskeys, loading } = useAppSelector(
		(state) => state.auth
	)
	
	const { data: authData, isLoading: checkingAuth, refetch } = useCheckAuthQuery(undefined, {
		// Poll every 5 minutes to refresh session
		pollingInterval: 5 * 60 * 1000,
		// Refetch on window focus
		refetchOnFocus: true,
	})
	
	const [logoutMutation, { isLoading: logoutLoading }] = useLogoutMutation()
	
	// Sync RTK Query data to Redux slice
	useEffect(() => {
		if (checkingAuth) {
			dispatch(setLoading(true))
			return
		}
		
		if (authData) {
			if (authData.authenticated && authData.user) {
				dispatch(setUser(authData.user))
				if (authData.hasPasskeys !== undefined) {
					dispatch(setHasPasskeys(authData.hasPasskeys))
				}
			} else {
				dispatch(logoutAction())
			}
		}
		
		dispatch(setLoading(false))
	}, [authData, checkingAuth, dispatch])
	
	const logout = async () => {
		try {
			await logoutMutation().unwrap()
			dispatch(logoutAction())
		} catch (error) {
			// Even if logout fails, clear local state
			dispatch(logoutAction())
			throw error
		}
	}
	
	// Expose refetch function to manually refresh auth state
	// Useful after passkey registration
	const refreshAuth = () => {
		refetch()
	}
	
	return {
		user,
		authenticated,
		hasPasskeys,
		loading: loading || checkingAuth,
		logout,
		logoutLoading,
		refreshAuth,
	}
}
