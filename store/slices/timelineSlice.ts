import { createSlice } from '@reduxjs/toolkit';

interface TimelineState {
  // Will be expanded later
}

const initialState: TimelineState = {};

const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {},
});

export default timelineSlice.reducer;
