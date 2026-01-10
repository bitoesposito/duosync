import { createSlice } from '@reduxjs/toolkit';

interface IntervalsState {
  // Will be expanded later
}

const initialState: IntervalsState = {};

const intervalsSlice = createSlice({
  name: 'intervals',
  initialState,
  reducers: {},
});

export default intervalsSlice.reducer;
