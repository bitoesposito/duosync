/**
 * Auth Slice
 * 
 * Manages authentication state (user, session status)
 * Synchronized with token-based auth system
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/types"

interface AuthState {
	user: User | null
	authenticated: boolean
	hasPasskeys: boolean
	loading: boolean
}

const initialState: AuthState = {
	user: null,
	authenticated: false,
	hasPasskeys: false,
	loading: true,
}

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<User>) => {
			state.user = action.payload
			state.authenticated = true
			state.loading = false
		},
		setHasPasskeys: (state, action: PayloadAction<boolean>) => {
			state.hasPasskeys = action.payload
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload
		},
		logout: (state) => {
			state.user = null
			state.authenticated = false
			state.hasPasskeys = false
			state.loading = false
		},
	},
})

export const { setUser, setHasPasskeys, setLoading, logout } = authSlice.actions
export default authSlice.reducer
