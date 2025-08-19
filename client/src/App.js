import React, { useState, useEffect } from 'react'
import axios from 'axios'
import io from 'socket.io-client'
import WalletManager from './components/WalletManager'
import BlockchainExplorer from './components/BlockchainExplorer'
import TransactionManager from './components/TransactionManager'
import MiningPanel from './components/MiningPanel'
import Dashboard from './components/Dashboard'
import useAutoRefresh from './hooks/useAutoRefresh'

const socket = io('http://localhost:5001')

function App () {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [blockchainData, setBlockchainData] = useState({
    info: {},
    blocks: [],
    transactions: [],
    pendingTransactions: []
  })
  const [wallets, setWallets] = useState([])
  const [notifications, setNotifications] = useState([])

  // 获取区块链数据
  const fetchBlockchainData = async () => {
    try {
      const [infoRes, blocksRes, transactionsRes, pendingRes] = await Promise.all([
        axios.get('/api/blockchain/info'),
        axios.get('/api/blockchain/blocks'),
        axios.get('/api/blockchain/transactions'),
        axios.get('/api/blockchain/pending-transactions')
      ])

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

  // 获取钱包数据
  const fetchWallets = async () => {
    try {
      const response = await axios.get('/api/wallets')
      setWallets(response.data)
    } catch (error) {
      console.error('Error fetching wallets:', error)
    }
  }

  // 组合刷新函数
  const refreshAllData = async () => {
    await Promise.all([
      fetchBlockchainData(),
      fetchWallets()
    ])
  }

  // 使用自动刷新Hook，默认5秒间隔，静默刷新
  const { manualRefresh } = useAutoRefresh(refreshAllData, 5000, true)

  useEffect(() => {
    // 初始加载数据
    refreshAllData()

    // Set up socket listeners
    socket.on('blockchainState', (data) => {
      setBlockchainData({
        info: data.blockchain,
        blocks: data.blocks,
        transactions: data.blocks.flatMap(block => block.transactions),
        pendingTransactions: data.pendingTransactions
      })
    })

    socket.on('newTransaction', (transaction) => {
      addNotification(`新交易: ${transaction.amount} 代币从 ${transaction.from} 转给 ${transaction.to}`, 'info')
      // 交易创建后立即刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    socket.on('blockMined', (block) => {
      addNotification(`新区块已挖出! 区块 #${blockchainData.blocks.length}`, 'success')
      // 挖矿完成后立即刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    socket.on('tokensMinted', (transaction) => {
      addNotification(`${transaction.amount} 代币已铸造给 ${transaction.to}`, 'success')
      // 铸造完成后立即刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    socket.on('walletCreated', (wallet) => {
      addNotification(`新钱包创建: ${wallet.name}`, 'success')
      // 钱包创建后立即刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    socket.on('walletDeleted', (walletName) => {
      addNotification(`钱包删除: ${walletName}`, 'info')
      // 钱包删除后立即刷新数据
      setTimeout(() => {
        refreshAllData()
      }, 1000)
    })

    return () => {
      socket.off('blockchainState')
      socket.off('newTransaction')
      socket.off('blockMined')
      socket.off('tokensMinted')
      socket.off('walletCreated')
      socket.off('walletDeleted')
    }
  }, [blockchainData.blocks.length])

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }

    setNotifications(prev => [notification, ...prev.slice(0, 4)])

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const tabs = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'wallets', label: '钱包管理', icon: '👛' },
    { id: 'transactions', label: '交易管理', icon: '💸' },
    { id: 'mining', label: '挖矿', icon: '⛏️' },
    { id: 'explorer', label: '区块浏览器', icon: '🔍' }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            blockchainData={blockchainData}
            wallets={wallets}
            notifications={notifications}
            onRefresh={manualRefresh}
          />
        )
      case 'wallets':
        return (
          <WalletManager
            wallets={wallets}
            onWalletsChange={manualRefresh}
          />
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
        <p>基于CosmJS的区块链应用，连接真实Cosmos网络</p>
      </div>

      {notifications.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {notifications.map(notification => (
            <div key={notification.id} className={`alert ${notification.type}`}>
              <strong>{notification.timestamp}</strong> - {notification.message}
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        {tabs.map(tab => (
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