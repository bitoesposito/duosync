/**
 * Auth API (RTK Query)
 * 
 * RTK Query endpoints for authentication
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

import type { User } from "@/types"

export interface AuthCheckResponse {
	authenticated: boolean
	user?: User
	hasPasskeys?: boolean
	error?: string
	code?: string
}

export const authApi = createApi({
	reducerPath: "authApi",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api",
		credentials: "include", // Include cookies for auth token
	}),
	tagTypes: ["Auth"],
	endpoints: (builder) => ({
		checkAuth: builder.query<AuthCheckResponse, void>({
			query: () => "/auth/check",
			providesTags: ["Auth"],
		}),
		logout: builder.mutation<void, void>({
			query: () => ({
				url: "/auth/logout",
				method: "POST",
			}),
			invalidatesTags: ["Auth"],
		}),
	}),
})

export const { useCheckAuthQuery, useLogoutMutation } = authApi
