import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ContentResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateProfileRequest
} from "@/entities/content/model/types";

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
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
    updateTask: builder.mutation<ContentResponse, { id: number; body: UpdateTaskRequest }>({
      query: ({ body, id }) => ({
        url: `tasks/${id}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Content"]
    }),
    deleteTask: builder.mutation<ContentResponse, number>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE"
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

export const {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetContentQuery,
  useUpdateProfileMutation,
  useUpdateTaskMutation
} = contentApi;
