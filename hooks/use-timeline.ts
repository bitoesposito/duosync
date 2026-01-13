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
import { useAuth } from "@/hooks/use-auth"
import type { TimelineSegment } from "@/types"

/**
 * Hook for timeline management
 * 
 * @param date - Date string in YYYY-MM-DD format (optional, uses selectedDate from state)
 * @param userIds - Array of user IDs (optional, uses selectedUserIds from state)
 */
export function useTimeline(date?: string, userIds?: number[]) {
	const dispatch = useAppDispatch()
	const { user } = useAuth()
	const selectedDate = useAppSelector((state) => state.timeline.selectedDate)
	const selectedUserIds = useAppSelector((state) => state.timeline.selectedUserIds)

	const currentDate = date || selectedDate

	// Determine user IDs to fetch:
	// 1. Explicit argument
	// 2. Redux state selection
	// 3. Fallback to current user (Personal Timeline)
	const currentUserIds = useMemo(() => {
		if (userIds && userIds.length > 0) return userIds
		if (selectedUserIds.length > 0) return selectedUserIds
		if (user?.id) return [user.id]
		return []
	}, [userIds, selectedUserIds, user])

	// RTK Query hook
	const {
		data: segments = [],
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetTimelineQuery(
		{ date: currentDate, userIds: currentUserIds },
		{
			skip: currentUserIds.length === 0,
			refetchOnMountOrArgChange: false,
		}
	)

	// Separate personal and shared segments for display
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
