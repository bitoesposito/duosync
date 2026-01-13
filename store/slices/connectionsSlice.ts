/**
 * Connections Slice
 * 
 * Manages local state for user connections
 * Actual data is managed by RTK Query (connectionsApi)
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { UserConnection } from "@/types"

interface ConnectionsState {
	acceptedConnections: UserConnection[] // Only accepted connections
	pendingConnections: UserConnection[] // Pending requests (as requester)
	pendingReceived: UserConnection[] // Pending requests (as addressee)
}

const initialState: ConnectionsState = {
	acceptedConnections: [],
	pendingConnections: [],
	pendingReceived: [],
}

const connectionsSlice = createSlice({
	name: "connections",
	initialState,
	reducers: {
		setAcceptedConnections: (state, action: PayloadAction<UserConnection[]>) => {
			state.acceptedConnections = action.payload
		},
		setPendingConnections: (state, action: PayloadAction<UserConnection[]>) => {
			state.pendingConnections = action.payload
		},
		setPendingReceived: (state, action: PayloadAction<UserConnection[]>) => {
			state.pendingReceived = action.payload
		},
	},
})

export const {
	setAcceptedConnections,
	setPendingConnections,
	setPendingReceived,
} = connectionsSlice.actions
export default connectionsSlice.reducer

