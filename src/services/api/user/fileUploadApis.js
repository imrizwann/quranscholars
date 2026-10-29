import { apiBaseQuery } from "../base-query.js";
import { createApi } from "@reduxjs/toolkit/query/react";

const fileUploadApi = createApi({
    reducerPath: 'fileUploadApi',
    baseQuery: apiBaseQuery,
    tagTypes: ['uploadFiles'],
    endpoints: (builder) => ({
        uploadAvatar: builder.mutation({
            query: (file) => ({
                url: 'api/upload/avatar',
                method: "POST",
                body: file
            }),
            invalidatesTags: (result, error) => error ? [] : ['uploadFiles']
        }),
        getAvatarUrl: builder.query({
            query: () => ({
                url: 'api/upload/avatar_url'
            }),
            providesTags:['uploadFiles']
        })

    })
})

export const { useUploadAvatarMutation, useGetAvatarUrlQuery } = fileUploadApi
export default fileUploadApi
