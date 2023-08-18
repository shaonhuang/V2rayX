import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface ServersPageState {
  serverTemplate?: Object;
  currentServerId: string;
  serviceRunningState: boolean;
  servers: any[];
}

export const readFromDb = createAsyncThunk('readFromDb', async () => {
  const state: ServersPageState = {
    servers: [],
    currentServerId: '',
    serviceRunningState: false,
  };
  state.servers = await window.db.read('servers');
  state.currentServerId = await window.db.read('currentServerId');
  return state;
});

const initialState: ServersPageState = {
  servers: [],
  currentServerId: '',
  serverTemplate: {},
  serviceRunningState: false,
};

const serversPageSlice = createSlice({
  name: 'serversPage',
  initialState,
  reducers: {
    getServerTemplate: (state, action: PayloadAction<Object>) => {
      state.serverTemplate = action.payload;
    },
    setCurrentServerId: (state, action: PayloadAction<string>) => {
      state.currentServerId = action.payload;
      window.db.write('currentServerId', action.payload);
    },
    setServersState: (state, action: PayloadAction<any[]>) => {
      state.servers = action.payload;
      window.db.write('servers', action.payload);
    },
    setServiceRunningState: (state, action: PayloadAction<boolean>) => {
      state.serviceRunningState = action.payload;
      window.db.write('serviceRunningState', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readFromDb.fulfilled, (state, action) => {
      state.servers = action.payload.servers;
      state.currentServerId = action.payload.currentServerId;
    });
  },
});

export const { setCurrentServerId, setServersState } = serversPageSlice.actions;

export default serversPageSlice.reducer;
