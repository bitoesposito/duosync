import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { intervalsApi } from './api/intervalsApi';
import { timelineApi } from './api/timelineApi';
import { connectionsApi } from './api/connectionsApi';
import authSlice from './slices/authSlice';
import intervalsSlice from './slices/intervalsSlice';
import timelineSlice from './slices/timelineSlice';
import connectionsSlice from './slices/connectionsSlice';
import uiSlice from './slices/uiSlice';
import { createWrapper } from 'next-redux-wrapper';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      auth: authSlice,
      intervals: intervalsSlice,
      timeline: timelineSlice,
      connections: connectionsSlice,
      ui: uiSlice,
      [intervalsApi.reducerPath]: intervalsApi.reducer,
      [timelineApi.reducerPath]: timelineApi.reducer,
      [connectionsApi.reducerPath]: connectionsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        intervalsApi.middleware,
        timelineApi.middleware,
        connectionsApi.middleware
      ),
  });

  // Setup RTK Query listeners for refetchOnFocus/refetchOnReconnect
  setupListeners(store.dispatch);

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// Create wrapper for next-redux-wrapper
export const wrapper = createWrapper<AppStore>(makeStore, {
  debug: process.env.NODE_ENV === 'development',
});