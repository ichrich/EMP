import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ContentResponse,
  CreateTaskRequest,
  TaskPriority,
  TaskStatus,
  UpdateTaskRequest,
  UpdateProfileRequest
} from "@/entities/content/model/types";

const statusMap: Record<string, TaskStatus> = {
  new: "Новая",
  in_progress: "В работе",
  review: "На проверке",
  done: "Готово",
  Новая: "Новая",
  "В работе": "В работе",
  "На проверке": "На проверке",
  Готово: "Готово"
};

const priorityMap: Record<string, TaskPriority> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  Низкий: "Низкий",
  Средний: "Средний",
  Высокий: "Высокий"
};

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
      async onQueryStarted({ body, id }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          contentApi.util.updateQueryData("getContent", undefined, (draft) => {
            const task = draft.tasks.find((item) => item.id === id);

            if (!task) {
              return;
            }

            if (body.title !== undefined) {
              task.title = body.title;
            }

            if (body.description !== undefined) {
              task.description = body.description;
            }

            if (body.status !== undefined) {
              task.status = statusMap[body.status] ?? task.status;
            }

            if (body.priority !== undefined) {
              task.priority = priorityMap[body.priority] ?? task.priority;
            }

            if (body.startDate !== undefined) {
              task.startDate = body.startDate;
            }

            if (body.dueDate !== undefined) {
              task.dueDate = body.dueDate;
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ["Content"]
    }),
    deleteTask: builder.mutation<ContentResponse, number>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE"
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          contentApi.util.updateQueryData("getContent", undefined, (draft) => {
            draft.tasks = draft.tasks.filter((task) => task.id !== id);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
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
