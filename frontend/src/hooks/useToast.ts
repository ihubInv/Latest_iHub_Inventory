import { useState, useCallback } from 'react'
import type { ToastProps } from '../components/ui/Toast'

interface ToastOptions {
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      id,
      ...options,
      onClose: (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      },
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'success' })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'error' })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'warning' })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    return addToast({ title, description, type: 'info' })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
