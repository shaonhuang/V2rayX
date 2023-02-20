import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NavTabState {
  tabName: string;
}
const initialState: NavTabState = {
  tabName: "home",
};
// tabName's options home config setting about

const navTabSlice = createSlice({
  name: "navTab",
  initialState,
  reducers: {
    setNavTab: (state, action: PayloadAction<string>) => {
      state.tabName = action.payload;
    },
  },
});
export const { setNavTab } = navTabSlice.actions;

export default navTabSlice.reducer;
