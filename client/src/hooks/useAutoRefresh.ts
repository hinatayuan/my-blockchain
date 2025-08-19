import { useEffect, useRef, useState } from 'react'

interface UseAutoRefreshReturn {
  isRefreshing: boolean
  manualRefresh: () => Promise<void>
  startAutoRefresh: () => void
  stopAutoRefresh: () => void
  setRefreshInterval: (newInterval: number) => void
  lastRefresh: number
}

const useAutoRefresh = (
  refreshFunction: () => Promise<void>,
  interval: number = 5000,
  enabled: boolean = true
): UseAutoRefreshReturn => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(Date.now())

  // 手动刷新函数
  const manualRefresh = async (): Promise<void> => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await refreshFunction()
      lastRefreshRef.current = Date.now()
    } catch (error) {
      console.error('自动刷新失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 启动自动刷新
  const startAutoRefresh = (): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (enabled) {
        manualRefresh()
      }
    }, interval)
  }

  // 停止自动刷新
  const stopAutoRefresh = (): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 设置刷新间隔
  const setRefreshInterval = (newInterval: number): void => {
    stopAutoRefresh()
    if (enabled) {
      intervalRef.current = setInterval(() => {
        manualRefresh()
      }, newInterval)
    }
  }

  useEffect(() => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [enabled, interval])

  return {
    isRefreshing,
    manualRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    setRefreshInterval,
    lastRefresh: lastRefreshRef.current
  }
}

export default useAutoRefresh
