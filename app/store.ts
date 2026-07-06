import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/entities/auth/api/auth-api";
import { contentApi } from "@/entities/content/api/content-api";
import { portalReducer } from "@/features/portal-preferences/model/portal-slice";

export const store = configureStore({
  reducer: {
    portal: portalReducer,
    [authApi.reducerPath]: authApi.reducer,
    [contentApi.reducerPath]: contentApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, contentApi.middleware),
  devTools: process.env.NODE_ENV !== "production"
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
