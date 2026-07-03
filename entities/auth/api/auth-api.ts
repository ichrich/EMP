import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from "@/entities/content/model/types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/auth", credentials: "include" }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    getSession: builder.query<AuthResponse, void>({
      query: () => "session",
      providesTags: ["Auth"]
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "login",
        method: "POST",
        body
      }),
      invalidatesTags: ["Auth"]
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "register",
        method: "POST",
        body
      }),
      invalidatesTags: ["Auth"]
    }),
    logout: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "logout",
        method: "POST"
      }),
      invalidatesTags: ["Auth"]
    })
  })
});

export const { useGetSessionQuery, useLoginMutation, useLogoutMutation, useRegisterMutation } =
  authApi;
