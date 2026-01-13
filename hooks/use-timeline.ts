/**
 * useTimeline Hook
 * 
 * Public API hook for timeline management
 * Wraps Redux RTK Query and slices
 */

import { useMemo, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useGetTimelineQuery, type TimelineQueryParams } from "@/store/api/timelineApi"
import { setSelectedDate, setSelectedUserIds } from "@/store/slices/timelineSlice"
import type { TimelineSegment } from "@/types"

/**
 * Hook for timeline management
 * 
 * @param date - Date string in YYYY-MM-DD format (optional, uses selectedDate from state)
 * @param userIds - Array of user IDs (optional, uses selectedUserIds from state)
 */
export function useTimeline(date?: string, userIds?: number[]) {
	const dispatch = useAppDispatch()
	const selectedDate = useAppSelector((state) => state.timeline.selectedDate)
	const selectedUserIds = useAppSelector((state) => state.timeline.selectedUserIds)

	const currentDate = date || selectedDate
	const currentUserIds = userIds || selectedUserIds

	// RTK Query hook
	// Skip query if no userIds to avoid unnecessary API calls
	const {
		data: segments = [],
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetTimelineQuery(
		{ date: currentDate, userIds: currentUserIds },
		{ 
			skip: currentUserIds.length === 0, // Skip if no users selected
			// Don't refetch on mount if we already have data
			refetchOnMountOrArgChange: false,
		}
	)

	// Separate personal and shared segments for display
	// Note: This is NOT a logical decision - the backend already calculates
	// and marks shared segments with category "match". We're just organizing
	// the data for rendering (transformation, not calculation).
	const { personalSegments, sharedSegments } = useMemo(() => {
		if (!segments || segments.length === 0) {
			return { personalSegments: [], sharedSegments: [] }
		}

		// Personal segments: all except "match" (already calculated by backend)
		const personal = segments.filter((s) => s.category !== "match")
		
		// Shared segments: only "match" (overlapping availability, already calculated by backend)
		const shared = segments.filter((s) => s.category === "match")

		return {
			personalSegments: personal,
			sharedSegments: shared,
		}
	}, [segments])

	// Actions
	const setDate = useCallback(
		(newDate: string) => {
			dispatch(setSelectedDate(newDate))
		},
		[dispatch]
	)

	const setUserIds = useCallback(
		(newUserIds: number[]) => {
			dispatch(setSelectedUserIds(newUserIds))
		},
		[dispatch]
	)

	return {
		// Data
		segments,
		personalSegments,
		sharedSegments,
		selectedDate: currentDate,
		selectedUserIds: currentUserIds,
		// Loading states
		// When skip=true, isLoading is false, but we want to be explicit
		isLoading: currentUserIds.length === 0 ? false : isLoading,
		isFetching: currentUserIds.length === 0 ? false : isFetching,
		// Error
		error,
		// Actions
		setDate,
		setUserIds,
		refetch,
	}
}

