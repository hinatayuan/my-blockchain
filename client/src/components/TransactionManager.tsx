// React核心库和状态管理
import React, { useState, useEffect } from 'react'
// HTTP请求库
import axios from 'axios'

// 钱包数据接口
interface Wallet {
  name: string // 钱包名称
  address: string // 钱包地址
  publicKey: string // 公钥
  balance: number // 余额
}

// 消息提示接口
interface Message {
  text: string // 消息文本
  type: 'info' | 'success' | 'error' // 消息类型
}

// 交易数据接口
interface Transaction {
  id: number // 交易ID
  from: string // 发送者地址
  to: string // 接收者地址
  amount: number // 交易金额
  type: string // 交易类型
  timestamp: number // 交易时间戳
  status: string // 交易状态（pending/confirmed）
}

// TransactionManager组件的props接口
interface TransactionManagerProps {
  wallets: Wallet[] // 钱包列表
  onTransactionCreate: () => void // 交易创建后的回调函数
}

/**
 * 交易管理组件
 * 提供代币转账功能，显示交易表单、交易历史和统计信息
 * 支持在钱包之间转账，使用椭圆曲线数字签名验证交易
 */
const TransactionManager: React.FC<TransactionManagerProps> = ({
  wallets, // 从父组件传入的钱包列表
  onTransactionCreate // 交易创建后的回调函数
}) => {
  // 发送者钱包名称状态
  const [fromWallet, setFromWallet] = useState<string>('')
  // 接收者地址状态
  const [toAddress, setToAddress] = useState<string>('')
  // 交易金额状态
  const [amount, setAmount] = useState<string>('')
  // 加载状态，用于显示交易处理进度
  const [loading, setLoading] = useState<boolean>(false)
  // 消息提示状态
  const [message, setMessage] = useState<Message | null>(null)
  // 最近交易记录状态
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  )
  // 用于监控钱包数量变化
  const [lastWalletCount, setLastWalletCount] = useState<number>(wallets.length)

  /**
   * 监听钱包数量变化的Effect Hook
   * 当检测到新钱包时，提示用户刷新页面
   */
  useEffect(() => {
    if (wallets.length !== lastWalletCount) {
      setLastWalletCount(wallets.length)
      // 如果钱包数量增加，显示提示信息
      if (wallets.length > lastWalletCount) {
        setMessage({
          text: `检测到新钱包，请刷新页面获取最新余额`,
          type: 'info'
        })
      }
    }
  }, [wallets.length, lastWalletCount])

  /**
   * 发送交易函数
   * 创建一笔新的代币转账交易，使用椭圆曲线数字签名验证
   * @param e 表单提交事件
   */
  const sendTransaction = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault() // 阻止表单默认提交

    // 验证表单字段
    if (!fromWallet || !toAddress || !amount || parseFloat(amount) <= 0) {
      setMessage({ text: '请填写所有字段并输入有效值', type: 'error' })
      return
    }

    // 查找发送者钱包
    const senderWallet = wallets.find((w) => w.name === fromWallet)
    if (!senderWallet) {
      setMessage({ text: '找不到发送者钱包', type: 'error' })
      return
    }

    // 检查余额是否足够
    if (senderWallet.balance < parseFloat(amount)) {
      setMessage({ text: '余额不足', type: 'error' })
      return
    }

    const transactionAmount = parseFloat(amount)
    setLoading(true)
    setMessage({
      text: `正在创建转账交易（${transactionAmount} 代币）...`,
      type: 'info'
    })

    try {
      // 调用后端API创建交易，后端会使用私钥签名交易
      const response = await axios.post('/api/transactions', {
        fromWalletName: fromWallet, // 发送者钱包名称
        to: toAddress, // 接收者地址
        amount: transactionAmount, // 交易金额
        memo: '区块链应用转账' // 交易备注
      })

      // 添加到本地最近交易列表显示
      const newTransaction: Transaction = {
        id: Date.now(), // 使用时间戳作为ID
        from: senderWallet.address, // 发送者地址
        to: toAddress, // 接收者地址
        amount: transactionAmount, // 交易金额
        type: 'transfer', // 交易类型
        timestamp: Date.now(), // 交易时间
        status: 'pending' // 初始状态为待处理
      }

      // 保持最近5笔最近交易
      setRecentTransactions((prev) => [newTransaction, ...prev.slice(0, 4)])

      setMessage({
        text: `✨ 交易创建成功！${transactionAmount} 代币已添加到待处理队列`,
        type: 'success'
      })

      // 重置表单
      setFromWallet('')
      setToAddress('')
      setAmount('')

      // 延迟刷新数据，等待后端处理完成
      setTimeout(() => {
        onTransactionCreate()
      }, 500)
    } catch (error: any) {
      // 处理交易创建失败的情况
      setMessage({
        text: error.response?.data?.error || '创建交易失败，请检查余额和地址',
        type: 'error'
      })
    } finally {
      setLoading(false) // 重置加载状态
    }
  }

  /**
   * 快速选择接收者
   * 从钱包列表中快速选择一个钱包作为接收者
   * @param walletName 钱包名称
   */
  const quickSelectRecipient = (walletName: string): void => {
    const wallet = wallets.find((w) => w.name === walletName)
    if (wallet) {
      setToAddress(wallet.address) // 设置接收者地址为该钱包的地址
    }
  }

  /**
   * 计算所有钱包的总可用余额
   * @returns 总余额
   */
  const getTotalAvailableBalance = (): number => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  }

  /**
   * 获取有资金的钱包数量
   * @returns 余额大于0的钱包数量
   */
  const getWalletsWithFunds = (): number => {
    return wallets.filter((w) => w.balance > 0).length
  }

  return (
    <div>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className="card">
        <h2>💸 发送交易</h2>
        <form onSubmit={sendTransaction}>
          <div className="form-group">
            <label htmlFor="fromWallet">发送者钱包</label>
            <select
              id="fromWallet"
              value={fromWallet}
              onChange={(e) => setFromWallet(e.target.value)}
              disabled={loading}
            >
              <option value="">选择发送者钱包...</option>
              {wallets.map((wallet) => (
                <option key={wallet.name} value={wallet.name}>
                  {wallet.name} (余额: {wallet.balance} 代币)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="toAddress">接收者地址</label>
            <input
              id="toAddress"
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="输入接收者地址"
              disabled={loading}
            />

            <div style={{ marginTop: '0.5rem' }}>
              <small
                style={{
                  color: '#666',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}
              >
                快速选择接收者:
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {wallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    type="button"
                    className="btn secondary"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => quickSelectRecipient(wallet.name)}
                    disabled={loading}
                  >
                    {wallet.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">数量</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入发送数量"
              min="0"
              step="0.01"
              disabled={loading}
            />
            {fromWallet && (
              <small
                style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}
              >
                可用余额:{' '}
                {wallets.find((w) => w.name === fromWallet)?.balance || 0} 代币
              </small>
            )}
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading || wallets.length === 0}
            style={{
              position: 'relative',
              minHeight: '44px'
            }}
          >
            {loading ? (
              <>
                <span
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
                发送中...
              </>
            ) : (
              '💸 发送交易'
            )}
          </button>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </div>

      {wallets.length === 0 && (
        <div className="card">
          <div className="alert info">
            <strong>没有可用的钱包！</strong>
            <br />
            您需要创建至少两个钱包才能发送交易。
            请前往钱包选项卡创建您的第一个钱包。
          </div>
        </div>
      )}

      {wallets.length > 0 && (
        <div className="card">
          <h2>📊 交易助手</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{wallets.length}</div>
              <div className="stat-label">可用钱包</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{getWalletsWithFunds()}</div>
              <div className="stat-label">有资金钱包</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{getTotalAvailableBalance()}</div>
              <div className="stat-label">总可用金额</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{recentTransactions.length}</div>
              <div className="stat-label">最近交易</div>
            </div>
          </div>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            💰 钱包余额
          </h3>
          <div className="wallet-list">
            {wallets.map((wallet) => (
              <div key={wallet.name} className="wallet-card">
                <div className="wallet-name">{wallet.name}</div>
                <div className="wallet-address">{wallet.address}</div>
                <div className="wallet-balance">{wallet.balance} 代币</div>
                {wallet.balance === 0 && (
                  <div
                    style={{
                      color: '#dc3545',
                      fontSize: '0.9rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    ⚠️ 无可用资金
                  </div>
                )}
                {wallet.balance > 0 && (
                  <div
                    style={{
                      color: '#28a745',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    ✅ 可发送交易
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近交易记录 */}
      {recentTransactions.length > 0 && (
        <div className="card">
          <h2>📝 最近交易记录</h2>
          <div className="transaction-list">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="transaction-item"
                style={{
                  borderLeft: `4px solid ${
                    tx.status === 'pending' ? '#ffc107' : '#28a745'
                  }`,
                  backgroundColor:
                    tx.status === 'pending' ? '#fffbf0' : '#f8fff9'
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
                      color: tx.status === 'pending' ? '#ffc107' : '#28a745',
                      fontWeight: 'bold'
                    }}
                  >
                    {tx.status === 'pending' ? '⏳ 待确认' : '✅ 已确认'}
                  </div>
                </div>
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
        <h2>💡 交易提示</h2>
        <div style={{ color: '#666' }}>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>交易会被添加到待处理池中，必须被挖掘以获得确认</li>
            <li>您的发送者钱包需要有足够的余额</li>
            <li>使用挖矿选项卡来挖掘待处理交易并确认它们</li>
            <li>每个挖出的区块都会为矿工提供挖矿奖励</li>
            <li>您可以向任何有效地址发送代币，包括您创建的钱包</li>
            <li>系统会自动刷新交易状态和钱包余额</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TransactionManager
