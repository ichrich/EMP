import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { portalSummary } from "@/entities/employee/model/mock-data";
import type { PortalSummary } from "@/entities/employee/model/types";

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["PortalSummary"],
  endpoints: (builder) => ({
    getPortalSummary: builder.query<PortalSummary, void>({
      queryFn: async () => ({ data: portalSummary }),
      providesTags: ["PortalSummary"]
    })
  })
});

export const { useGetPortalSummaryQuery } = employeeApi;
