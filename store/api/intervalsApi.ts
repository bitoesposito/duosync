import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const intervalsApi = createApi({
  reducerPath: 'intervalsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/intervals',
  }),
  tagTypes: ['Interval'],
  endpoints: (builder) => ({
    // Endpoints will be added later
  }),
});
