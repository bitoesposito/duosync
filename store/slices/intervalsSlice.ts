/**
 * Intervals Slice
 * 
 * Manages local state for intervals (selected date, etc.)
 * Actual data is managed by RTK Query (intervalsApi)
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface IntervalsState {
	selectedDate: string // YYYY-MM-DD format (UTC)
}

const initialState: IntervalsState = {
	selectedDate: new Date().toISOString().split("T")[0], // Today in UTC
}

const intervalsSlice = createSlice({
	name: "intervals",
	initialState,
	reducers: {
		setSelectedDate: (state, action: PayloadAction<string>) => {
			state.selectedDate = action.payload
		},
	},
})

export const { setSelectedDate } = intervalsSlice.actions
export default intervalsSlice.reducer

