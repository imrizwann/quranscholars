import { createSlice } from "@reduxjs/toolkit";
const slice = createSlice({ name: "realtime", initialState: { connected: false }, reducers: {
  setRealtimeConnected(state, action) { state.connected = action.payload === true; },
} });
export const { setRealtimeConnected } = slice.actions;
export default slice.reducer;
