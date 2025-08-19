import React from 'react';

const Dashboard = ({ blockchainData, wallets, notifications, onRefresh }) => {
  const { info } = blockchainData;
  
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalTransactions = blockchainData.transactions.length;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>📊 系统概览</h2>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            title="刷新所有数据"
          >
            🔄 刷新
          </button>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{info.height || 0}</div>
          <div className="stat-label">区块高度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-label">总交易数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{info.pendingTransactions || 0}</div>
          <div className="stat-label">待处理交易</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{wallets.length}</div>
          <div className="stat-label">活跃钱包</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalBalance}</div>
          <div className="stat-label">代币总量</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{info.difficulty || 0}</div>
          <div className="stat-label">挖矿难度</div>
        </div>
      </div>

      <div className="card">
        <h2>📊 区块链状态</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span 
            className={`status-indicator ${info.isValid ? 'connected' : 'disconnected'}`}
          ></span>
          <span>
            区块链 {info.isValid ? '有效' : '无效'}
          </span>
        </div>
        <p><strong>最新区块哈希:</strong> {blockchainData.blocks[blockchainData.blocks.length - 1]?.hash?.substring(0, 32) || '无'}...</p>
        <p><strong>代币总量:</strong> {info.totalSupply || 0} 代币</p>
      </div>

      <div className="card">
        <h2>👛 钱包概览</h2>
        {wallets.length === 0 ? (
          <div className="no-data">尚未创建钱包</div>
        ) : (
          <div className="wallet-list">
            {wallets.slice(0, 3).map((wallet, index) => (
              <div key={index} className="wallet-card">
                <div className="wallet-name">{wallet.name}</div>
                <div className="wallet-address">{wallet.address}</div>
                <div className="wallet-balance">{wallet.balance} 代币</div>
              </div>
            ))}
            {wallets.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                ... 还有 {wallets.length - 3} 个钱包
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>📈 最近活动</h2>
        {blockchainData.transactions.length === 0 ? (
          <div className="no-data">尚无交易</div>
        ) : (
          <div className="transaction-list">
            {blockchainData.transactions.slice(-5).reverse().map((tx, index) => (
              <div key={index} className="transaction-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{tx.type}</strong>: {tx.amount} 代币
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                {tx.from && tx.to && (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    从: {tx.from.substring(0, 16)}... → 到: {tx.to.substring(0, 16)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {blockchainData.pendingTransactions.length > 0 && (
        <div className="card">
          <h2>⏳ 待处理交易</h2>
          <div className="transaction-list">
            {blockchainData.pendingTransactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{tx.type}</strong>: {tx.amount} 代币
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    等待挖掘...
                  </div>
                </div>
                {tx.from && tx.to && (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    从: {tx.from.substring(0, 16)}... → 到: {tx.to.substring(0, 16)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;