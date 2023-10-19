import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface infoState {
  version: string;
  mode: string;
  autoLaunch: boolean;
  appearance: string;
}

const initialState: infoState = {
  version: '0.0.1',
  mode: 'Manual',
  autoLaunch: false,
  appearance: 'light',
};

export const readFromDbInfo = createAsyncThunk('readFromDb-info', async () => {
  const state: infoState = {
    version: '0.0.1',
    mode: 'Manual',
    autoLaunch: false,
    appearance: 'light',
  };

  state.version = await window.db.read('appVersion');
  state.autoLaunch = await window.db.read('autoLaunch');
  const settings = await window.db.read('settings');
  state.mode = settings.proxyMode;
  state.appearance = settings.appearance;
  // console.table(state)
  return state;
});

const infoSlice = createSlice({
  name: 'info',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(readFromDbInfo.fulfilled, (state, action) => {
      state.version = action.payload.version;
      state.mode = action.payload.mode;
      state.autoLaunch = action.payload.autoLaunch;
      state.appearance = action.payload.appearance;
    });
  },
});

export const {} = infoSlice.actions;

export default infoSlice.reducer;
