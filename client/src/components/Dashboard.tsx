import React from 'react'

interface BlockchainData {
  info: {
    height?: number
    difficulty?: number
    pendingTransactions?: number
    totalSupply?: number
    isValid?: boolean
    miningReward?: number
  }
  blocks: any[]
  transactions: any[]
  pendingTransactions: any[]
}

interface Wallet {
  name: string
  address: string
  publicKey: string
  balance: number
}

interface Notification {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
  timestamp: string
}

interface DashboardProps {
  blockchainData: BlockchainData
  wallets: Wallet[]
  notifications: Notification[]
}

const Dashboard: React.FC<DashboardProps> = ({
  blockchainData,
  wallets,
  notifications
}) => {
  const { info } = blockchainData

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const totalTransactions = blockchainData.transactions.length
  const pendingCount = blockchainData.pendingTransactions.length

  // 计算最近24小时的交易数量
  const getRecentTransactions = (): number => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    return blockchainData.transactions.filter((tx) => tx.timestamp > oneDayAgo)
      .length
  }

  // 计算平均区块时间
  const getAverageBlockTime = (): string => {
    if (blockchainData.blocks.length < 2) return 'N/A'
    const blocks = blockchainData.blocks.slice(-10) // 最近10个区块
    if (blocks.length < 2) return 'N/A'

    let totalTime = 0
    for (let i = 1; i < blocks.length; i++) {
      totalTime += blocks[i].timestamp - blocks[i - 1].timestamp
    }
    const avgTime = totalTime / (blocks.length - 1)
    return `${Math.round(avgTime / 1000)}秒`
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <h2 style={{ margin: 0 }}>📊 系统概览</h2>
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
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">待处理交易</div>
          {pendingCount > 0 && (
            <div
              style={{
                fontSize: '0.8rem',
                color: '#ffc107',
                marginTop: '0.25rem',
                fontWeight: 'bold'
              }}
            >
              ⏳ 等待挖矿
            </div>
          )}
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

      {/* 实时状态指示器 */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>📈 实时状态</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: '#6c757d',
                marginBottom: '0.5rem'
              }}
            >
              24小时交易
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#007bff'
              }}
            >
              {getRecentTransactions()}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: '#6c757d',
                marginBottom: '0.5rem'
              }}
            >
              平均区块时间
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#28a745'
              }}
            >
              {getAverageBlockTime()}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: '#6c757d',
                marginBottom: '0.5rem'
              }}
            >
              挖矿奖励
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#ffc107'
              }}
            >
              {info.miningReward || 100}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: '#6c757d',
                marginBottom: '0.5rem'
              }}
            >
              链状态
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: info.isValid ? '#28a745' : '#dc3545',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: info.isValid ? '#28a745' : '#dc3545',
                  borderRadius: '50%'
                }}
              ></span>
              {info.isValid ? '正常' : '异常'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>📊 区块链状态</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem'
          }}
        >
          <span
            className={`status-indicator ${
              info.isValid ? 'connected' : 'disconnected'
            }`}
          ></span>
          <span>区块链 {info.isValid ? '有效' : '无效'}</span>
        </div>
        <p>
          <strong>最新区块哈希:</strong>{' '}
          {blockchainData.blocks[
            blockchainData.blocks.length - 1
          ]?.hash?.substring(0, 32) || '无'}
          ...
        </p>
        <p>
          <strong>代币总量:</strong> {info.totalSupply || 0} 代币
        </p>
        <p>
          <strong>最后更新时间:</strong> {new Date().toLocaleString()}
        </p>
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
                {wallet.balance === 0 && (
                  <div
                    style={{
                      color: '#ffc107',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    💡 可以使用水龙头获取代币
                  </div>
                )}
              </div>
            ))}
            {wallets.length > 3 && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '1rem',
                  color: '#666'
                }}
              >
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
            {blockchainData.transactions
              .slice(-5)
              .reverse()
              .map((tx, index) => (
                <div key={index} className="transaction-item">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>{tx.type}</strong>: {tx.amount} 代币
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {tx.from && tx.to && (
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#666',
                        marginTop: '0.5rem'
                      }}
                    >
                      从: {tx.from.substring(0, 16)}... → 到:{' '}
                      {tx.to.substring(0, 16)}...
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {blockchainData.pendingTransactions.length > 0 && (
        <div className="card">
          <h2>⏳ 待处理交易 ({pendingCount})</h2>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              marginBottom: '1rem',
              color: '#856404'
            }}
          >
            <strong>💡 提示:</strong>{' '}
            这些交易正在等待被挖掘。请前往挖矿页面开始挖矿以确认这些交易。
          </div>
          <div className="transaction-list">
            {blockchainData.pendingTransactions.map((tx, index) => (
              <div
                key={index}
                className="transaction-item"
                style={{
                  borderLeft: '4px solid #ffc107',
                  backgroundColor: '#fffbf0'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{tx.type}</strong>: {tx.amount} 代币
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#ffc107',
                      fontWeight: 'bold'
                    }}
                  >
                    ⏳ 等待挖掘
                  </div>
                </div>
                {tx.from && tx.to && (
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: '#666',
                      marginTop: '0.5rem'
                    }}
                  >
                    从: {tx.from.substring(0, 16)}... → 到:{' '}
                    {tx.to.substring(0, 16)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
