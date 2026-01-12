/**
 * Redux Store Configuration
 * 
 * Store setup with Redux Toolkit and RTK Query
 */

import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
// Import slices and APIs as they are created
// import { intervalsApi } from "./api/intervalsApi"
// import { timelineApi } from "./api/timelineApi"
// import { connectionsApi } from "./api/connectionsApi"
// import authSlice from "./slices/authSlice"
// import intervalsSlice from "./slices/intervalsSlice"
// import timelineSlice from "./slices/timelineSlice"
// import connectionsSlice from "./slices/connectionsSlice"
// import uiSlice from "./slices/uiSlice"

export const makeStore = () => {
	return configureStore({
		reducer: {
			// Add slices and APIs here as they are created
			// auth: authSlice,
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

// Setup listeners for RTK Query
setupListeners(makeStore().dispatch)
