// React核心库和状态管理
import React, { useState, useEffect } from 'react'
// HTTP请求库
import axios from 'axios'
// WebSocket客户端库
import io from 'socket.io-client'
// 各个功能组件
import WalletManager from './components/WalletManager'
import BlockchainExplorer from './components/BlockchainExplorer'
import TransactionManager from './components/TransactionManager'
import MiningPanel from './components/MiningPanel'
import Dashboard from './components/Dashboard'
// 自定义Hook
import useAutoRefresh from './hooks/useAutoRefresh'

// 连接到后端区块链服务器的WebSocket
const socket = io('http://localhost:5002')

// 区块链数据接口，定义从服务器获取的数据结构
interface BlockchainData {
  info: {
    height?: number // 区块链高度
    difficulty?: number // 挖矿难度
    pendingTransactions?: number // 待处理交易数
    totalSupply?: number // 代币总供应量
    isValid?: boolean // 区块链是否有效
    miningReward?: number // 挖矿奖励
  }
  blocks: any[] // 区块列表
  transactions: any[] // 交易列表
  pendingTransactions: any[] // 待处理交易列表
}

// 钱包接口，定义钱包的基本信息
interface Wallet {
  name: string // 钱包名称
  address: string // 钱包地址
  publicKey: string // 公钥
  balance: number // 余额
}

// 通知接口，用于显示系统通知信息
interface Notification {
  id: number // 通知唯一ID
  message: string // 通知内容
  type: 'info' | 'success' | 'error' // 通知类型
  timestamp: string // 时间戳
}

/**
 * 主应用组件，管理整个区块链前端应用
 * 提供多个功能页面：仪表盘、钱包管理、交易管理、挖矿和区块浏览器
 */
function App(): JSX.Element {
  // 当前激活的标签页面
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  
  // 区块链数据状态
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    info: {}, // 区块链基本信息
    blocks: [], // 区块列表
    transactions: [], // 所有交易
    pendingTransactions: [] // 待处理交易
  })
  
  // 钱包列表状态
  const [wallets, setWallets] = useState<Wallet[]>([])
  
  // 系统通知状态
  const [notifications, setNotifications] = useState<Notification[]>([])

  /**
   * 获取区块链的所有数据
   * 并发请求多个API接口获取区块链信息、区块、交易等数据
   */
  const fetchBlockchainData = async (): Promise<void> => {
    try {
      // 并发请求多个API接口，提高数据加载速度
      const [infoRes, blocksRes, transactionsRes, pendingRes] =
        await Promise.all([
          axios.get('/api/blockchain/info'), // 区块链基本信息
          axios.get('/api/blockchain/blocks'), // 所有区块
          axios.get('/api/blockchain/transactions'), // 所有交易
          axios.get('/api/blockchain/pending-transactions') // 待处理交易
        ])

      // 更新区块链数据状态
      setBlockchainData({
        info: infoRes.data,
        blocks: blocksRes.data,
        transactions: transactionsRes.data,
        pendingTransactions: pendingRes.data
      })
    } catch (error) {
      console.error('Error fetching blockchain data:', error)
    }
  }

  /**
   * 获取所有钱包数据
   * 包括钱包名称、地址、公钥和当前余额
   */
  const fetchWallets = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/wallets')
      setWallets(response.data) // 更新钱包列表状态
    } catch (error) {
      console.error('Error fetching wallets:', error)
    }
  }

  /**
   * 组合刷新函数，同时刷新区块链数据和钱包数据
   */
  const refreshAllData = async (): Promise<void> => {
    await Promise.all([fetchBlockchainData(), fetchWallets()])
  }

  // 使用自定义Hook实现自动刷新功能
  // 5秒间隔自动刷新，静默模式（不显示加载状态）
  const { manualRefresh } = useAutoRefresh(refreshAllData, 5000, true)

  useEffect(() => {
    // 初始加载页面数据
    refreshAllData()

    // 设置WebSocket事件监听器以实现实时数据更新
    
    // 监听初始区块链状态数据
    socket.on('blockchainState', (data) => {
      setBlockchainData({
        info: data.blockchain, // 区块链信息
        blocks: data.blocks, // 区块列表
        transactions: data.blocks.flatMap((block: any) => block.transactions), // 从所有区块中提取交易
        pendingTransactions: data.pendingTransactions // 待处理交易
      })
    })

    // 监听新交易事件
    socket.on('newTransaction', (transaction) => {
      addNotification(
        `新交易: ${transaction.amount} 代币从 ${transaction.from} 转给 ${transaction.to}`,
        'info'
      )
      // 交易创建后稍延迟刷新数据，等待服务器处理完成
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    // 监听区块挖掉事件
    socket.on('blockMined', (block) => {
      addNotification(
        `新区块已挖出! 区块 #${blockchainData.blocks.length}`,
        'success'
      )
      // 挖矿完成后稍延迟刷新数据，等待区块链更新
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    // 监听代币铸造事件
    socket.on('tokensMinted', (transaction) => {
      addNotification(
        `${transaction.amount} 代币已铸造给 ${transaction.to}`,
        'success'
      )
      // 铸造完成后稍延迟刷新数据，等待区块链更新
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    // 监听钱包创建事件
    socket.on('walletCreated', (wallet) => {
      addNotification(`新钱包创建: ${wallet.name}`, 'success')
      // 钱包创建后稍延迟刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    // 监听钱包删除事件
    socket.on('walletDeleted', (walletName) => {
      addNotification(`钱包删除: ${walletName}`, 'info')
      // 钱包删除后稍延迟刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    // 组件销毁时清理所有WebSocket事件监听器
    return () => {
      socket.off('blockchainState')
      socket.off('newTransaction')
      socket.off('blockMined')
      socket.off('tokensMinted')
      socket.off('walletCreated')
      socket.off('walletDeleted')
    }
  }, [blockchainData.blocks.length]) // 依赖区块数量变化重新设置监听器

  /**
   * 添加系统通知
   * @param message 通知消息
   * @param type 通知类型（info/success/error）
   */
  const addNotification = (
    message: string,
    type: 'info' | 'success' | 'error' = 'info'
  ): void => {
    const notification: Notification = {
      id: Date.now(), // 使用时间戳作为唯一ID
      message,
      type,
      timestamp: new Date().toLocaleTimeString() // 格式化的时间戳
    }

    // 最多保挎5个通知，新通知在最前面
    setNotifications((prev) => [notification, ...prev.slice(0, 4)])

    // 5秒后自动移除通知
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    }, 5000)
  }

  const tabs = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'wallets', label: '钱包管理', icon: '👛' },
    { id: 'transactions', label: '交易管理', icon: '💸' },
    { id: 'mining', label: '挖矿', icon: '⛏️' },
    { id: 'explorer', label: '区块浏览器', icon: '🔍' }
  ]

  const renderActiveTab = (): JSX.Element => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            blockchainData={blockchainData}
            wallets={wallets}
            notifications={notifications}
          />
        )
      case 'wallets':
        return (
          <WalletManager wallets={wallets} onWalletsChange={manualRefresh} />
        )
      case 'transactions':
        return (
          <TransactionManager
            wallets={wallets}
            onTransactionCreate={manualRefresh}
          />
        )
      case 'mining':
        return (
          <MiningPanel
            wallets={wallets}
            pendingTransactions={blockchainData.pendingTransactions}
            onBlockMined={manualRefresh}
          />
        )
      case 'explorer':
        return <BlockchainExplorer blockchainData={blockchainData} />
      default:
        return <div>页面未找到</div>
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔗 我的区块链</h1>
        <p>基于JS的区块链应用</p>
      </div>

      {notifications.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {notifications.map((notification) => (
            <div key={notification.id} className={`alert ${notification.type}`}>
              <strong>{notification.timestamp}</strong> - {notification.message}
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {renderActiveTab()}
    </div>
  )
}

export default App
