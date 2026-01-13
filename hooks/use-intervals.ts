/**
 * useIntervals Hook
 * 
 * Public API hook for intervals management
 * Wraps Redux RTK Query and slices
 */

import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
	useGetIntervalsQuery,
	useCreateIntervalMutation,
	useUpdateIntervalMutation,
	useDeleteIntervalMutation,
	type CreateIntervalInput,
	type UpdateIntervalInput,
} from "@/store/api/intervalsApi"
import { timelineApi } from "@/store/api/timelineApi"
import { setSelectedDate } from "@/store/slices/intervalsSlice"
import type { Interval } from "@/types"

/**
 * Hook for intervals management
 * 
 * @param date - Date string in YYYY-MM-DD format (optional, uses selectedDate from state)
 */
export function useIntervals(date?: string) {
	const dispatch = useAppDispatch()
	const selectedDate = useAppSelector((state) => state.intervals.selectedDate)
	const currentDate = date || selectedDate

	// RTK Query hooks
	const {
		data: intervals = [],
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetIntervalsQuery(currentDate)

	const [createIntervalMutation, { isLoading: isCreating }] = useCreateIntervalMutation()
	const [updateIntervalMutation, { isLoading: isUpdating }] = useUpdateIntervalMutation()
	const [deleteIntervalMutation, { isLoading: isDeleting }] = useDeleteIntervalMutation()

	// Actions
	const setDate = useCallback(
		(newDate: string) => {
			dispatch(setSelectedDate(newDate))
		},
		[dispatch]
	)

	const create = useCallback(
		async (input: CreateIntervalInput): Promise<Interval> => {
			const result = await createIntervalMutation(input).unwrap()
			// Invalidate timeline triggers a refetch of availability grid
			dispatch(timelineApi.util.invalidateTags(["Timeline"]))
			return result
		},
		[createIntervalMutation, dispatch]
	)

	const update = useCallback(
		async (id: number, input: UpdateIntervalInput): Promise<Interval> => {
			const result = await updateIntervalMutation({ id, data: input }).unwrap()
			// Invalidate timeline triggers a refetch of availability grid
			dispatch(timelineApi.util.invalidateTags(["Timeline"]))
			return result
		},
		[updateIntervalMutation, dispatch]
	)

	const remove = useCallback(
		async (id: number): Promise<void> => {
			await deleteIntervalMutation(id).unwrap()
			// Invalidate timeline triggers a refetch of availability grid
			dispatch(timelineApi.util.invalidateTags(["Timeline"]))
		},
		[deleteIntervalMutation, dispatch]
	)

	return {
		// Data
		intervals,
		selectedDate: currentDate,
		// Loading states
		isLoading,
		isFetching,
		isSaving: isCreating || isUpdating || isDeleting,
		// Error
		error,
		// Actions
		setDate,
		create,
		update,
		remove,
		refetch,
	}
}
