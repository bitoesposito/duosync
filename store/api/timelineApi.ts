/**
 * Timeline API (RTK Query)
 * 
 * RTK Query endpoint for timeline calculation
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { TimelineSegment } from "@/types"

/**
 * Timeline query parameters
 */
export interface TimelineQueryParams {
	date: string // YYYY-MM-DD format
	userIds: number[] // Array of user IDs
}

/**
 * Timeline response
 * 
 * Note: API returns array of segments directly
 * We'll separate personal and shared in the hook
 */
export type TimelineResponse = TimelineSegment[]

export const timelineApi = createApi({
	reducerPath: "timelineApi",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api",
		credentials: "include", // Include cookies for auth token
	}),
	tagTypes: ["Timeline"],
	endpoints: (builder) => ({
		/**
		 * GET /api/timeline?date=YYYY-MM-DD&userIds=1,2,3
		 * Get timeline segments for a specific date and users
		 * 
		 * Returns array of segments (already converted to user timezone)
		 */
		getTimeline: builder.query<TimelineResponse, TimelineQueryParams>({
			query: ({ date, userIds }) => {
				const userIdsParam = userIds.join(",")
				return `/timeline?date=${date}&userIds=${userIdsParam}`
			},
			providesTags: ["Timeline"],
			// Cache for 5 minutes (300 seconds)
			keepUnusedDataFor: 300,
		}),
	}),
})

export const { useGetTimelineQuery } = timelineApi

