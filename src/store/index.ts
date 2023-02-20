import { configureStore } from "@reduxjs/toolkit";
import serversReducer from "./serversSlice";
import navTabReducer from "./navigationSlice";

const store = configureStore({
  reducer: {
    navTab: navTabReducer,
    servers: serversReducer,
  },
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
