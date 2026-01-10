import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const timelineApi = createApi({
  reducerPath: 'timelineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/timeline',
  }),
  tagTypes: ['Timeline'],
  endpoints: (builder) => ({
    // Endpoints will be added later
  }),
});
