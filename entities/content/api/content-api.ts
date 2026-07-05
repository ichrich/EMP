import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ContentResponse,
  CreateTaskRequest,
  UpdateProfileRequest
} from "@/entities/content/model/types";

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Content"],
  endpoints: (builder) => ({
    getContent: builder.query<ContentResponse, void>({
      query: () => "content",
      providesTags: ["Content"]
    }),
    createTask: builder.mutation<ContentResponse, CreateTaskRequest>({
      query: (body) => ({
        url: "tasks",
        method: "POST",
        body
      }),
      invalidatesTags: ["Content"]
    }),
    updateProfile: builder.mutation<ContentResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: "profile",
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Content"]
    })
  })
});

export const { useCreateTaskMutation, useGetContentQuery, useUpdateProfileMutation } = contentApi;
