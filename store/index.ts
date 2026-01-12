/**
 * Redux Store Configuration
 * 
 * Store setup with Redux Toolkit and RTK Query
 */

import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import authSlice from "./slices/authSlice"
import { authApi } from "./api/authApi"
// Import slices and APIs as they are created
// import { intervalsApi } from "./api/intervalsApi"
// import { timelineApi } from "./api/timelineApi"
// import { connectionsApi } from "./api/connectionsApi"
// import intervalsSlice from "./slices/intervalsSlice"
// import timelineSlice from "./slices/timelineSlice"
// import connectionsSlice from "./slices/connectionsSlice"
// import uiSlice from "./slices/uiSlice"

export const makeStore = () => {
	return configureStore({
		reducer: {
			auth: authSlice,
			[authApi.reducerPath]: authApi.reducer,
			// Add slices and APIs here as they are created
			// intervals: intervalsSlice,
			// timeline: timelineSlice,
			// connections: connectionsSlice,
			// ui: uiSlice,
			// [intervalsApi.reducerPath]: intervalsApi.reducer,
			// [timelineApi.reducerPath]: timelineApi.reducer,
			// [connectionsApi.reducerPath]: connectionsApi.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware()
				.concat(authApi.middleware)
				// Add RTK Query middleware here as APIs are created
				// .concat(
				// 	intervalsApi.middleware,
				// 	timelineApi.middleware,
				// 	connectionsApi.middleware
				// )
		,
	})
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

// Setup listeners for RTK Query (only on client side)
if (typeof window !== "undefined") {
	setupListeners(makeStore().dispatch)
}
