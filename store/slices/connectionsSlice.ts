import { createSlice } from '@reduxjs/toolkit';

interface ConnectionsState {
  // Will be expanded later
}

const initialState: ConnectionsState = {};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {},
});

export default connectionsSlice.reducer;
