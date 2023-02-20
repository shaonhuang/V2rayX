import { createSlice, configureStore } from "@reduxjs/toolkit";

const serversSlice = createSlice({
  name: "servers",
  initialState: {
    url: "",
  },
  reducers: {
    setUrl: (state, action) => {
      state.url = action.payload;
    },
    deleteUrl: (state) => {
      state.url = "";
    },
  },
});

export const { setUrl, deleteUrl } = serversSlice.actions;

export default serversSlice.reducer;
