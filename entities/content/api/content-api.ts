import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ContentResponse } from "@/entities/content/model/types";

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Content"],
  endpoints: (builder) => ({
    getContent: builder.query<ContentResponse, void>({
      query: () => "content",
      providesTags: ["Content"]
    })
  })
});

export const { useGetContentQuery } = contentApi;
