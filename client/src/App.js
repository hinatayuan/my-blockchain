import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import WalletManager from './components/WalletManager';
import BlockchainExplorer from './components/BlockchainExplorer';
import TransactionManager from './components/TransactionManager';
import MiningPanel from './components/MiningPanel';
import Dashboard from './components/Dashboard';

const socket = io('http://localhost:5001');

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [blockchainData, setBlockchainData] = useState({
    info: {},
    blocks: [],
    transactions: [],
    pendingTransactions: []
  });
  const [wallets, setWallets] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch initial data
    fetchBlockchainData();
    fetchWallets();

    // Set up socket listeners
    socket.on('blockchainState', (data) => {
      setBlockchainData({
        info: data.blockchain,
        blocks: data.blocks,
        transactions: data.blocks.flatMap(block => block.transactions),
        pendingTransactions: data.pendingTransactions
      });
    });

    socket.on('newTransaction', (transaction) => {
      addNotification(`新交易: ${transaction.amount} 代币从 ${transaction.from} 转给 ${transaction.to}`, 'info');
      fetchBlockchainData();
    });

    socket.on('blockMined', (block) => {
      addNotification(`新区块已挖出! 区块 #${blockchainData.blocks.length}`, 'success');
      fetchBlockchainData();
      fetchWallets();
    });

    socket.on('tokensMinted', (transaction) => {
      addNotification(`${transaction.amount} 代币已铸造给 ${transaction.to}`, 'success');
      fetchBlockchainData();
      fetchWallets();
    });

    return () => {
      socket.off('blockchainState');
      socket.off('newTransaction');
      socket.off('blockMined');
      socket.off('tokensMinted');
    };
  }, [blockchainData.blocks.length]);

  const fetchBlockchainData = async () => {
    try {
      const [infoRes, blocksRes, transactionsRes, pendingRes] = await Promise.all([
        axios.get('/api/blockchain/info'),
        axios.get('/api/blockchain/blocks'),
        axios.get('/api/blockchain/transactions'),
        axios.get('/api/blockchain/pending-transactions')
      ]);

      setBlockchainData({
        info: infoRes.data,
        blocks: blocksRes.data,
        transactions: transactionsRes.data,
        pendingTransactions: pendingRes.data
      });
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    }
  };

  const fetchWallets = async () => {
    try {
      const response = await axios.get('/api/wallets');
      setWallets(response.data);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // 全局数据刷新函数
  const refreshAllData = async () => {
    await Promise.all([
      fetchBlockchainData(),
      fetchWallets()
    ]);
  };

  const tabs = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'wallets', label: '钱包管理', icon: '👛' },
    { id: 'transactions', label: '交易管理', icon: '💸' },
    { id: 'mining', label: '挖矿', icon: '⛏️' },
    { id: 'explorer', label: '区块浏览器', icon: '🔍' }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            blockchainData={blockchainData}
            wallets={wallets}
            notifications={notifications}
            onRefresh={refreshAllData}
          />
        );
      case 'wallets':
        return (
          <WalletManager 
            wallets={wallets} 
            onWalletsChange={refreshAllData}
          />
        );
      case 'transactions':
        return (
          <TransactionManager 
            wallets={wallets}
            onTransactionCreate={refreshAllData}
          />
        );
      case 'mining':
        return (
          <MiningPanel 
            wallets={wallets}
            pendingTransactions={blockchainData.pendingTransactions}
            onBlockMined={refreshAllData}
          />
        );
      case 'explorer':
        return <BlockchainExplorer blockchainData={blockchainData} />;
      default:
        return <div>页面未找到</div>;
    }
  };

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
  );
}

export default App;