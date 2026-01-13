/**
 * useConnections Hook
 * 
 * Public API hook for connections management
 * Wraps Redux RTK Query and slices
 */

import { useMemo, useCallback, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
	useGetConnectionsQuery,
	useCreateConnectionMutation,
	useUpdateConnectionMutation,
	useDeleteConnectionMutation,
	type CreateConnectionInput,
	type UpdateConnectionInput,
} from "@/store/api/connectionsApi"
import {
	setAcceptedConnections,
	setPendingConnections,
	setPendingReceived,
} from "@/store/slices/connectionsSlice"
import type { UserConnection } from "@/types"

/**
 * Hook for connections management
 */
export function useConnections() {
	const dispatch = useAppDispatch()

	// RTK Query hook
	// Note: If connections API doesn't exist yet, this will fail gracefully
	// We handle errors by returning empty array in transformResponse
	const {
		data: connections = [],
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetConnectionsQuery(undefined, {
		// Don't refetch on mount if we already have data
		refetchOnMountOrArgChange: false,
		// If there's an error that we can't recover from, don't keep retrying
		retry: false,
	})

	const [createConnectionMutation, { isLoading: isCreating }] = useCreateConnectionMutation()
	const [updateConnectionMutation, { isLoading: isUpdating }] = useUpdateConnectionMutation()
	const [deleteConnectionMutation, { isLoading: isDeleting }] = useDeleteConnectionMutation()

	// Separate connections by status
	const { accepted, pending, pendingReceived } = useMemo(() => {
		const accepted: UserConnection[] = []
		const pending: UserConnection[] = []
		const pendingReceived: UserConnection[] = []

		connections.forEach((connection) => {
			if (connection.status === "accepted") {
				accepted.push(connection)
			} else if (connection.status === "pending") {
				// Determine if user is requester or addressee
				// This requires current user ID from auth state
				// For now, we'll use a simple heuristic
				pending.push(connection)
			}
		})

		return { accepted, pending, pendingReceived }
	}, [connections])

	// Update slices when data changes (useEffect, not useMemo, because this is a side effect)
	useEffect(() => {
		dispatch(setAcceptedConnections(accepted))
		dispatch(setPendingConnections(pending))
		dispatch(setPendingReceived(pendingReceived))
	}, [accepted, pending, pendingReceived, dispatch])

	// Actions
	const create = useCallback(
		async (input: CreateConnectionInput): Promise<UserConnection> => {
			const result = await createConnectionMutation(input).unwrap()
			return result
		},
		[createConnectionMutation]
	)

	const update = useCallback(
		async (id: number, input: UpdateConnectionInput): Promise<UserConnection> => {
			const result = await updateConnectionMutation({ id, data: input }).unwrap()
			return result
		},
		[updateConnectionMutation]
	)

	const remove = useCallback(
		async (id: number): Promise<void> => {
			await deleteConnectionMutation(id).unwrap()
		},
		[deleteConnectionMutation]
	)

	return {
		// Data
		connections,
		accepted,
		pending,
		pendingReceived,
		// Loading states
		isLoading,
		isFetching,
		isSaving: isCreating || isUpdating || isDeleting,
		// Error
		error,
		// Actions
		create,
		update,
		remove,
		refetch,
	}
}

