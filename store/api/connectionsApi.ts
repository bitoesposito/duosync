/**
 * Connections API (RTK Query)
 * 
 * RTK Query endpoints for user connections
 * 
 * Note: Backend API may not exist yet, this is a placeholder structure
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { UserConnection } from "@/types"

/**
 * Connection input for creation
 */
export interface CreateConnectionInput {
	addresseeId: number
}

/**
 * Connection update input
 */
export interface UpdateConnectionInput {
	status?: "pending" | "accepted" | "blocked"
	canSeeAppointments?: boolean
}

// Custom baseQuery that handles 404/500 errors gracefully for connections
// This allows the app to work even if connections API is not implemented yet
const connectionsBaseQuery: BaseQueryFn<
	string | FetchArgs,
	unknown,
	FetchBaseQueryError
> = async (args, api, extraOptions) => {
	try {
		// Add timeout to prevent infinite loading
		const timeoutPromise = new Promise<{ error: FetchBaseQueryError }>((resolve) => {
			setTimeout(() => {
				resolve({
					error: {
						status: 408,
						data: "Request timeout",
					} as FetchBaseQueryError,
				})
			}, 5000) // 5 second timeout
		})

		const queryPromise = fetchBaseQuery({
			baseUrl: "/api",
			credentials: "include",
		})(args, api, extraOptions)

		const result = await Promise.race([queryPromise, timeoutPromise])
		
		// If endpoint doesn't exist (404), server error (500), or timeout (408), return empty array
		if (result.error && "status" in result.error) {
			const status = result.error.status
			if (status === 404 || status === 500 || status === 408) {
				return { data: [] as UserConnection[] }
			}
		}
		
		return result
	} catch (error) {
		// Network errors or other issues - return empty array
		return { data: [] as UserConnection[] }
	}
}

export const connectionsApi = createApi({
	reducerPath: "connectionsApi",
	baseQuery: connectionsBaseQuery,
	tagTypes: ["Connections"],
	endpoints: (builder) => ({
		/**
		 * GET /api/connections
		 * Get all connections for current user
		 * 
		 * Note: Endpoint may not exist yet - returns empty array if 404
		 */
		getConnections: builder.query<UserConnection[], void>({
			query: () => "/connections",
			providesTags: ["Connections"],
		}),

		/**
		 * POST /api/connections
		 * Create a new connection request
		 * 
		 * Note: Endpoint may not exist yet
		 */
		createConnection: builder.mutation<UserConnection, CreateConnectionInput>({
			query: (body) => ({
				url: "/connections",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Connections"],
		}),

		/**
		 * PUT /api/connections/:id
		 * Update connection status (accept/reject/block)
		 * 
		 * Note: Endpoint may not exist yet
		 */
		updateConnection: builder.mutation<
			UserConnection,
			{ id: number; data: UpdateConnectionInput }
		>({
			query: ({ id, data }) => ({
				url: `/connections/${id}`,
				method: "PUT",
				body: data,
			}),
			invalidatesTags: (result, error, { id }) => [
				{ type: "Connections", id },
				"Connections",
			],
		}),

		/**
		 * DELETE /api/connections/:id
		 * Delete/remove a connection
		 * 
		 * Note: Endpoint may not exist yet
		 */
		deleteConnection: builder.mutation<void, number>({
			query: (id) => ({
				url: `/connections/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: (result, error, id) => [
				{ type: "Connections", id },
				"Connections",
			],
		}),
	}),
})

export const {
	useGetConnectionsQuery,
	useCreateConnectionMutation,
	useUpdateConnectionMutation,
	useDeleteConnectionMutation,
} = connectionsApi

