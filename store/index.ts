/**
 * Redux Store Configuration
 * 
 * Store setup with Redux Toolkit and RTK Query
 */

import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import authSlice from "./slices/authSlice"
import intervalsSlice from "./slices/intervalsSlice"
import timelineSlice from "./slices/timelineSlice"
import connectionsSlice from "./slices/connectionsSlice"
import { authApi } from "./api/authApi"
import { intervalsApi } from "./api/intervalsApi"
import { timelineApi } from "./api/timelineApi"
import { connectionsApi } from "./api/connectionsApi"

export const makeStore = () => {
	return configureStore({
		reducer: {
			auth: authSlice,
			intervals: intervalsSlice,
			timeline: timelineSlice,
			connections: connectionsSlice,
			[authApi.reducerPath]: authApi.reducer,
			[intervalsApi.reducerPath]: intervalsApi.reducer,
			[timelineApi.reducerPath]: timelineApi.reducer,
			[connectionsApi.reducerPath]: connectionsApi.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware()
				.concat(authApi.middleware)
				.concat(intervalsApi.middleware)
				.concat(timelineApi.middleware)
				.concat(connectionsApi.middleware),
	})
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

// Setup listeners for RTK Query (only on client side)
if (typeof window !== "undefined") {
	setupListeners(makeStore().dispatch)
}
