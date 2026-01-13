/**
 * Intervals API (RTK Query)
 * 
 * RTK Query endpoints for intervals CRUD operations
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { Interval, RecurrenceRule } from "@/types"

/**
 * Interval input for creation/update
 */
export interface CreateIntervalInput {
	start_ts: string // ISO timestamp
	end_ts: string // ISO timestamp
	category: "sleep" | "busy" | "other"
	description?: string | null
	recurrence_rule?: RecurrenceRule | null
}

export interface UpdateIntervalInput {
	start_ts?: string
	end_ts?: string
	category?: "sleep" | "busy" | "other"
	description?: string | null
	recurrence_rule?: RecurrenceRule | null
}

/**
 * API response with error handling
 */
export interface ApiError {
	error: {
		code: string
		message: string
	}
}

export const intervalsApi = createApi({
	reducerPath: "intervalsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api",
		credentials: "include", // Include cookies for auth token
	}),
	tagTypes: ["Intervals"],
	endpoints: (builder) => ({
		/**
		 * GET /api/intervals?date=YYYY-MM-DD
		 * Get intervals for a specific date
		 */
		getIntervals: builder.query<Interval[], string>({
			query: (date) => `/intervals?date=${date}`,
			providesTags: ["Intervals"],
		}),

		/**
		 * GET /api/intervals/:id
		 * Get a single interval by ID
		 */
		getInterval: builder.query<Interval, number>({
			query: (id) => `/intervals/${id}`,
			providesTags: (result, error, id) => [{ type: "Intervals", id }],
		}),

		/**
		 * POST /api/intervals
		 * Create a new interval
		 */
		createInterval: builder.mutation<Interval, CreateIntervalInput>({
			query: (body) => ({
				url: "/intervals",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Intervals"],
		}),

		/**
		 * PUT /api/intervals/:id
		 * Update an existing interval
		 */
		updateInterval: builder.mutation<Interval, { id: number; data: UpdateIntervalInput }>({
			query: ({ id, data }) => ({
				url: `/intervals/${id}`,
				method: "PUT",
				body: data,
			}),
			invalidatesTags: (result, error, { id }) => [
				{ type: "Intervals", id },
				"Intervals",
			],
		}),

		/**
		 * DELETE /api/intervals/:id
		 * Delete an interval
		 */
		deleteInterval: builder.mutation<void, number>({
			query: (id) => ({
				url: `/intervals/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: (result, error, id) => [
				{ type: "Intervals", id },
				"Intervals",
			],
		}),
	}),
})

export const {
	useGetIntervalsQuery,
	useGetIntervalQuery,
	useCreateIntervalMutation,
	useUpdateIntervalMutation,
	useDeleteIntervalMutation,
} = intervalsApi

