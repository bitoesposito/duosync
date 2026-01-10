import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const connectionsApi = createApi({
  reducerPath: 'connectionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/connections',
  }),
  tagTypes: ['Connection'],
  endpoints: (builder) => ({
    // Endpoints will be added later
  }),
});
