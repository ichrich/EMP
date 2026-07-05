import { configureStore } from "@reduxjs/toolkit";
import { contentApi } from "@/entities/content/api/content-api";
import { employeeApi } from "@/entities/employee/api/employee-api";
import { portalReducer } from "@/features/portal-preferences/model/portal-slice";

export const store = configureStore({
  reducer: {
    portal: portalReducer,
    [contentApi.reducerPath]: contentApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(contentApi.middleware, employeeApi.middleware),
  devTools: process.env.NODE_ENV !== "production"
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
