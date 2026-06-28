import { configureStore } from "@reduxjs/toolkit";
import { employeeApi } from "@/entities/employee/api/employee-api";
import { portalReducer } from "@/features/portal-preferences/model/portal-slice";

export const store = configureStore({
  reducer: {
    portal: portalReducer,
    [employeeApi.reducerPath]: employeeApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(employeeApi.middleware),
  devTools: process.env.NODE_ENV !== "production"
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
