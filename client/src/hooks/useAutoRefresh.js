import { useEffect, useRef, useState } from 'react'

const useAutoRefresh = (refreshFunction, interval = 5000, enabled = true) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef(null)
  const lastRefreshRef = useRef(Date.now())

  // 手动刷新函数
  const manualRefresh = async () => {
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
  const startAutoRefresh = () => {
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
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 设置刷新间隔
  const setRefreshInterval = (newInterval) => {
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