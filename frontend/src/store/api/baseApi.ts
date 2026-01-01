import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'
import { logoutAction } from '../actions/authActions'
import toast from 'react-hot-toast'

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://31.97.60.2:5002/api', 
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  console.log('🌐 BaseApi: Making request to:', args.url, 'with method:', args.method || 'GET')
  console.log('🌐 BaseApi: Request body:', args.body)
  console.log('🌐 BaseApi: Base URL:', baseQuery.getState ? 'http://31.97.60.2:5002/api' : 'unknown')
  
  let result = await baseQuery(args, api, extraOptions)
  
  console.log('🌐 BaseApi: Response received:', {
    data: result.data,
    error: result.error,
    meta: result.meta
  })

  if (result.error && result.error.status === 401) {
    // Token expired or invalid
    console.log('🔐 BaseApi: Token expired, dispatching logout')
    api.dispatch({ type: logoutAction })
    toast.error('Session expired. Please login again.')
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Location',
    'Category',
    'Asset',
    'InventoryItem',
    'Request',
    'ReturnRequest',
    'Transaction',
    'Notification',
    'Dashboard',
  ],
  endpoints: () => ({}),
})
