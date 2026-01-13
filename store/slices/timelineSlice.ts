/**
 * Timeline Slice
 * 
 * Manages local state for timeline (selected date, selected users, etc.)
 * Actual data is managed by RTK Query (timelineApi)
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface TimelineState {
	selectedDate: string // YYYY-MM-DD format (UTC)
	selectedUserIds: number[] // Array of user IDs for timeline calculation
}

const initialState: TimelineState = {
	selectedDate: new Date().toISOString().split("T")[0], // Today in UTC
	selectedUserIds: [], // Will be populated with current user + connections
}

const timelineSlice = createSlice({
	name: "timeline",
	initialState,
	reducers: {
		setSelectedDate: (state, action: PayloadAction<string>) => {
			state.selectedDate = action.payload
		},
		setSelectedUserIds: (state, action: PayloadAction<number[]>) => {
			state.selectedUserIds = action.payload
		},
	},
})

export const { setSelectedDate, setSelectedUserIds } = timelineSlice.actions
export default timelineSlice.reducer

