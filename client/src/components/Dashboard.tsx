import React from 'react';
import { DashboardProps } from '../types';
import { formatTokenAmount, formatTime, formatAddress, formatRelativeTime } from '../utils/formatters';

const Dashboard: React.FC<DashboardProps> = ({ blockchainData, wallets, notifications }) => {
  const { info } = blockchainData;
  
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalTransactions = blockchainData.transactions.length;
  
  return (
    <div>
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
          <div className="stat-value">{formatTokenAmount(totalBalance)}</div>
          <div className="stat-label">钱包总余额</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatTokenAmount(info.totalSupply || 0)}</div>
          <div className="stat-label">代币总供应量</div>
        </div>
      </div>

      <div className="card">
        <h2>📊 区块链状态</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span 
            className={`status-indicator ${info.isValid ? 'connected' : 'disconnected'}`}
          ></span>
          <span>
            区块链 {info.isValid ? '正常运行' : '检测到异常'}
          </span>
        </div>
        <div className="blockchain-stats">
          <div className="stat-row">
            <strong>最新区块哈希:</strong> 
            <span className="hash-display">
              {blockchainData.blocks.length > 0 
                ? formatAddress(blockchainData.blocks[blockchainData.blocks.length - 1]?.hash || '', 16)
                : '无'
              }
            </span>
          </div>
          <div className="stat-row">
            <strong>难度:</strong> {info.difficulty || 0}
          </div>
          <div className="stat-row">
            <strong>网络哈希率:</strong> {info.networkHashRate || 0} H/min
          </div>
          <div className="stat-row">
            <strong>共识机制:</strong> 权益证明 (PoS)
          </div>
        </div>
      </div>

      <div className="card">
        <h2>👛 钱包概览</h2>
        {wallets.length === 0 ? (
          <div className="no-data">尚未创建钱包</div>
        ) : (
          <div className="wallet-list">
            {wallets.slice(0, 5).map((wallet, index) => (
              <div key={wallet.id || index} className="wallet-card">
                <div className="wallet-header">
                  <div className="wallet-name">{wallet.name}</div>
                  <div className="wallet-balance">{formatTokenAmount(wallet.balance)} 代币</div>
                </div>
                <div className="wallet-address">
                  {formatAddress(wallet.address)}
                </div>
              </div>
            ))}
            {wallets.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                ... 还有 {wallets.length - 5} 个钱包
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>📈 最近活动</h2>
        {blockchainData.transactions.length === 0 ? (
          <div className="no-data">尚无交易记录</div>
        ) : (
          <div className="transaction-list">
            {blockchainData.transactions.slice(-5).reverse().map((tx, index) => (
              <div key={tx.id || index} className="transaction-item">
                <div className="transaction-header">
                  <div className="transaction-type">
                    <span className={`type-badge type-${tx.type}`}>
                      {tx.type === 'transfer' ? '转账' : 
                       tx.type === 'mint' ? '铸造' : 
                       tx.type === 'burn' ? '销毁' : tx.type}
                    </span>
                    <span className="transaction-amount">
                      {formatTokenAmount(tx.amount)} 代币
                    </span>
                  </div>
                  <div className="transaction-time">
                    {formatRelativeTime(tx.timestamp)}
                  </div>
                </div>
                {tx.from && tx.to && tx.from !== 'system' && tx.to !== 'burn' && (
                  <div className="transaction-addresses">
                    从: {formatAddress(tx.from)} → 到: {formatAddress(tx.to)}
                  </div>
                )}
                {tx.memo && (
                  <div className="transaction-memo">
                    备注: {tx.memo}
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
              <div key={tx.id || index} className="transaction-item pending">
                <div className="transaction-header">
                  <div className="transaction-type">
                    <span className={`type-badge type-${tx.type}`}>
                      {tx.type === 'transfer' ? '转账' : 
                       tx.type === 'mint' ? '铸造' : 
                       tx.type === 'burn' ? '销毁' : tx.type}
                    </span>
                    <span className="transaction-amount">
                      {formatTokenAmount(tx.amount)} 代币
                    </span>
                  </div>
                  <div className="transaction-status pending">
                    等待打包...
                  </div>
                </div>
                {tx.from && tx.to && tx.from !== 'system' && tx.to !== 'burn' && (
                  <div className="transaction-addresses">
                    从: {formatAddress(tx.from)} → 到: {formatAddress(tx.to)}
                  </div>
                )}
                {tx.memo && (
                  <div className="transaction-memo">
                    备注: {tx.memo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="card">
          <h2>🔔 系统通知</h2>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className={`notification notification-${notification.type}`}>
                <div className="notification-header">
                  <span className="notification-time">{notification.timestamp}</span>
                  <span className={`notification-type type-${notification.type}`}>
                    {notification.type === 'info' ? '信息' :
                     notification.type === 'success' ? '成功' :
                     notification.type === 'warning' ? '警告' :
                     notification.type === 'error' ? '错误' : notification.type}
                  </span>
                </div>
                <div className="notification-message">{notification.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;