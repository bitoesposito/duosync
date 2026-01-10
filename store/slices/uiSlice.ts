import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  // Will be expanded later
}

const initialState: UiState = {};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {},
});

export default uiSlice.reducer;
