import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';
import serversPageReducer from './serversPageSlice';
import settingsPageReducer from './settingsPageSlice';

const store = configureStore({
  reducer: {
    serversPage: serversPageReducer,
    settingsPage: settingsPageReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
