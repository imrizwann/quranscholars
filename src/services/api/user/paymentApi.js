import { apiBaseQuery } from "../base-query.js";
import { createApi } from '@reduxjs/toolkit/query/react'
const paymentApi = createApi({
    reducerPath: 'paymentApi',
    baseQuery: apiBaseQuery,
    endpoints: (builder) => ({
        coursePayment: builder.mutation({
            query: (body) => ({
                url: '/api/payment',
                method: 'POST',
                body
            })
        })
    })
})

export const { useCoursePaymentMutation } = paymentApi

export default paymentApi