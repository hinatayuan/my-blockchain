import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Wallet {
  name: string
  address: string
  publicKey: string
  balance: number
}

interface Message {
  text: string
  type: 'info' | 'success' | 'error'
}

interface PendingTransaction {
  id?: string
  from?: string
  to: string
  amount: number
  type: string
  timestamp: number
}

interface MiningStats {
  blocksMinedToday: number
  totalRewardsEarned: number
}

interface MiningPanelProps {
  wallets: Wallet[]
  pendingTransactions: PendingTransaction[]
  onBlockMined: () => void
}

const MiningPanel: React.FC<MiningPanelProps> = ({
  wallets,
  pendingTransactions,
  onBlockMined
}) => {
  const [selectedMiner, setSelectedMiner] = useState<string>('')
  const [mining, setMining] = useState<boolean>(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [miningProgress, setMiningProgress] = useState<number>(0)
  const [miningStats, setMiningStats] = useState<MiningStats>({
    blocksMinedToday: 0,
    totalRewardsEarned: 0
  })
  const [lastPendingCount, setLastPendingCount] = useState<number>(
    pendingTransactions.length
  )

  // 监听待处理交易数量变化
  useEffect(() => {
    if (pendingTransactions.length !== lastPendingCount) {
      setLastPendingCount(pendingTransactions.length)

      // 如果有新的待处理交易，显示通知
      if (pendingTransactions.length > lastPendingCount) {
        setMessage({
          text: `发现 ${
            pendingTransactions.length - lastPendingCount
          } 个新待处理交易`,
          type: 'info'
        })
      }
    }
  }, [pendingTransactions.length, lastPendingCount])

  const startMining = async (): Promise<void> => {
    if (!selectedMiner) {
      setMessage({ text: '请选择矿工钱包', type: 'error' })
      return
    }

    if (pendingTransactions.length === 0) {
      setMessage({ text: '没有待处理的交易可挖掘', type: 'error' })
      return
    }

    const minerWallet = wallets.find((w) => w.name === selectedMiner)
    if (!minerWallet) {
      setMessage({ text: '找不到选中的矿工钱包', type: 'error' })
      return
    }

    setMining(true)
    setMiningProgress(0)
    setMessage({ text: '正在初始化挖矿进程...', type: 'info' })

    // 模拟挖矿进程
    const progressInterval = setInterval(() => {
      setMiningProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 20
      })
    }, 200)

    const difficulty = getMiningDifficulty()
    const estimatedTime = difficulty * 2000 // 毫秒

    setTimeout(() => {
      setMessage({
        text: `正在解决挖矿雾题（雾度: ${difficulty}）...`,
        type: 'info'
      })
    }, 500)

    try {
      const response = await axios.post('/api/mine', {
        minerWalletName: selectedMiner
      })

      clearInterval(progressInterval)
      setMiningProgress(100)

      setMessage({
        text: `✨ 挖矿成功！${selectedMiner} 获得 ${response.data.reward} 代币奖励`,
        type: 'success'
      })

      // Update mining stats
      setMiningStats((prev) => ({
        blocksMinedToday: prev.blocksMinedToday + 1,
        totalRewardsEarned: prev.totalRewardsEarned + response.data.reward
      }))

      // 自动刷新数据
      onBlockMined()

      // 清空选择的矿工，准备下一次挖矿
      setTimeout(() => {
        setSelectedMiner('')
        setMiningProgress(0)
      }, 3000)
    } catch (error: any) {
      clearInterval(progressInterval)
      setMiningProgress(0)
      setMessage({
        text: error.response?.data?.error || '挖矿失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setMining(false)
    }
  }

  const getMiningDifficulty = (): number => {
    // Simulate mining difficulty based on pending transactions
    return Math.max(2, Math.floor(pendingTransactions.length / 3) + 2)
  }

  const estimateMiningTime = (): string => {
    const difficulty = getMiningDifficulty()
    return `${difficulty * 2}-${difficulty * 4} seconds`
  }

  // 计算挖矿效率
  const getMiningEfficiency = (): string => {
    if (miningStats.blocksMinedToday === 0) return '0%'
    const efficiency = Math.min(100, (miningStats.blocksMinedToday / 10) * 100)
    return `${Math.round(efficiency)}%`
  }

  return (
    <div>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{pendingTransactions.length}</div>
          <div className="stat-label">待处理交易</div>
          {pendingTransactions.length > 0 && (
            <div
              style={{
                fontSize: '0.8rem',
                color: '#ffc107',
                marginTop: '0.25rem',
                fontWeight: 'bold'
              }}
            >
              ⏳ 等待挖掘
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-value">{getMiningDifficulty()}</div>
          <div className="stat-label">当前难度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">100</div>
          <div className="stat-label">挖矿奖励</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{estimateMiningTime()}</div>
          <div className="stat-label">预计时间</div>
        </div>
      </div>

      <div className="card">
        <h2>⛏️ 挖掘新区块</h2>
        {pendingTransactions.length === 0 ? (
          <div className="alert info">
            <strong>没有交易可挖掘！</strong>
            <br />
            请先创建一些交易，然后回来挖掘区块。
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="minerSelect">选择矿工钱包</label>
              <select
                id="minerSelect"
                value={selectedMiner}
                onChange={(e) => setSelectedMiner(e.target.value)}
                disabled={mining}
              >
                <option value="">选择矿工钱包...</option>
                {wallets.map((wallet) => (
                  <option key={wallet.name} value={wallet.name}>
                    {wallet.name} (当前: {wallet.balance} 代币)
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '5px',
                marginBottom: '1rem',
                border: '1px solid #e1e5e9'
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                挖矿信息
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                <li>
                  挖矿奖励: <strong>100 代币</strong>
                </li>
                <li>
                  待处理交易数: <strong>{pendingTransactions.length}</strong>
                </li>
                <li>
                  预计挖矿时间: <strong>{estimateMiningTime()}</strong>
                </li>
                <li>选中的矿工将获得奖励</li>
              </ul>
            </div>

            {/* 挖矿进度条 */}
            {mining && (
              <div
                style={{
                  marginBottom: '1rem',
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    挖矿进度
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#007bff' }}>
                    {Math.round(miningProgress)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${miningProgress}%`,
                      height: '100%',
                      backgroundColor:
                        miningProgress === 100 ? '#28a745' : '#007bff',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease, background-color 0.3s ease'
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginTop: '0.5rem',
                    textAlign: 'center'
                  }}
                >
                  {miningProgress < 100 ? '正在计算哈希值...' : '挖矿完成！'}
                </div>
              </div>
            )}

            <button
              className={`btn ${mining ? 'secondary' : 'success'}`}
              onClick={startMining}
              disabled={mining || !selectedMiner}
              style={{
                fontSize: '1.1rem',
                padding: '1rem 2rem',
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {mining ? (
                <>
                  <span
                    className="mining-spinner"
                    style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}
                  ></span>
                  挖矿中...
                </>
              ) : (
                '⛏️ 开始挖矿'
              )}
            </button>

            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
      </div>

      {pendingTransactions.length > 0 && (
        <div className="card">
          <h2>📋 待处理交易 ({pendingTransactions.length})</h2>
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
            这些交易将在下一次挖矿时被打包进区块。挖矿将一次性确认所有待处理交易。
          </div>
          <div className="transaction-list">
            {pendingTransactions.map((tx, index) => (
              <div
                key={tx.id || index}
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
                    <strong>{tx.type.toUpperCase()}</strong>: {tx.amount} 代币
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
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    marginTop: '0.5rem'
                  }}
                >
                  {tx.from ? (
                    <>
                      发送方: {tx.from.substring(0, 16)}... → 接收方:{' '}
                      {tx.to.substring(0, 16)}...
                    </>
                  ) : (
                    <>
                      接收方: {tx.to.substring(0, 16)}... (${tx.type})
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#856404',
                    marginTop: '0.25rem'
                  }}
                >
                  创建时间: {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>📈 挖矿统计</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{miningStats.blocksMinedToday}</div>
            <div className="stat-label">已挖掘区块</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{miningStats.totalRewardsEarned}</div>
            <div className="stat-label">总奖励</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{getMiningEfficiency()}</div>
            <div className="stat-label">挖矿效率</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pendingTransactions.length}</div>
            <div className="stat-label">待处理交易</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>💡 挖矿指南</h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <h4>挖矿如何工作:</h4>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>
              <strong>收集交易:</strong> 挖矿处理所有待处理的交易
            </li>
            <li>
              <strong>解决谜题:</strong> 系统找到符合雾度要求的哈希值
            </li>
            <li>
              <strong>创建区块:</strong> 有效交易被打包成新区块
            </li>
            <li>
              <strong>获得奖励:</strong> 矿工获得代币奖励
            </li>
            <li>
              <strong>更新链:</strong> 新区块被添加到区块链中
            </li>
          </ol>

          <h4 style={{ marginTop: '1rem' }}>提示:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>挖矿时间随雾度增加而增加</li>
            <li>更多的待处理交易不会减慢挖矿速度</li>
            <li>选择任何钱包来接收挖矿奖励</li>
            <li>挖矿一次性确认所有待处理交易</li>
            <li>系统会自动刷新待处理交易状态</li>
          </ul>
        </div>
      </div>

      {wallets.length === 0 && (
        <div className="card">
          <div className="alert info">
            <strong>没有可用的钱包！</strong>
            <br />
            请先创建一个钱包来接收挖矿奖励。请前往钱包选项卡开始。
          </div>
        </div>
      )}
    </div>
  )
}

export default MiningPanel
