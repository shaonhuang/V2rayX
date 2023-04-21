import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// discarded
interface ServersState {
  servers: any[];
}

const initialState: ServersState = {
  servers: [],
};

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setServer: (state, action: PayloadAction<any[]>) => {
      state.servers = action.payload;
    },
    deleteServer: (state, action: PayloadAction<Object>) => {
      // state.servers =
    },
  },
});

export const { setServer, deleteServer } = serversSlice.actions;

export default serversSlice.reducer;
