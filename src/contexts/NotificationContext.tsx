import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type LogType = 'log' | 'warn' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export interface SystemLog {
  id: string
  type: LogType
  timestamp: string
  message: string
}

interface NotificationContextProps {
  toasts: Toast[]
  logs: SystemLog[]
  showToast: (message: string, type?: ToastType) => void
  addLog: (message: string, type?: LogType) => void
  clearLogs: () => void
  showConsole: boolean
  setShowConsole: (show: boolean) => void
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [showConsole, setShowConsole] = useState(false)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setTimeout(() => {
      setToasts(prev => [...prev, { id, type, message }])
    }, 0)
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const addLog = useCallback((message: string, type: LogType = 'log') => {
    const id = Math.random().toString(36).substring(2, 9)
    const timestamp = new Date().toLocaleTimeString()
    setTimeout(() => {
      setLogs(prev => {
        // Keep last 100 logs
        const next = [...prev, { id, type, timestamp, message }]
        if (next.length > 100) {
          return next.slice(next.length - 100)
        }
        return next
      })
    }, 0)
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // Helper to filter out third-party/browser-extension noise
  const isNoiseMessage = useCallback((msg: string): boolean => {
    if (!msg) return false
    const noiseKeywords = [
      'A listener indicated an asynchronous response by returning true',
      'message channel closed before a response was received',
      'nodeTypes or edgeTypes object',
      '[React Flow]',
      '[Intervention]',
      'chrome-extension://',
      'AdobeClean',
      'Slow network is detected'
    ]
    return noiseKeywords.some(keyword => msg.includes(keyword))
  }, [])

  // Hook into console and global window errors
  useEffect(() => {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    const originalInfo = console.info

    console.log = (...args) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      if (!isNoiseMessage(msg)) {
        addLog(msg, 'log')
      }
      originalLog.apply(console, args)
    }

    console.warn = (...args) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      if (!isNoiseMessage(msg)) {
        addLog(msg, 'warn')
      }
      originalWarn.apply(console, args)
    }

    console.error = (...args) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      if (!isNoiseMessage(msg)) {
        addLog(msg, 'error')
        showToast(msg.length > 100 ? msg.substring(0, 100) + '...' : msg, 'error')
      }
      originalError.apply(console, args)
    }

    console.info = (...args) => {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      if (!isNoiseMessage(msg)) {
        addLog(msg, 'info')
      }
      originalInfo.apply(console, args)
    }

    const handleWindowError = (event: ErrorEvent) => {
      const msg = `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}`
      if (!isNoiseMessage(msg)) {
        addLog(msg, 'error')
        showToast(`Błąd systemu: ${event.message}`, 'error')
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const msg = reason instanceof Error ? reason.message : String(reason)
      if (!isNoiseMessage(msg)) {
        addLog(`Unhandled Promise Rejection: ${msg}`, 'error')
        showToast(`Błąd obietnicy: ${msg}`, 'error')
      }
    }

    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.info = originalInfo
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [addLog, showToast, isNoiseMessage])

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        logs,
        showToast,
        addLog,
        clearLogs,
        showConsole,
        setShowConsole,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
