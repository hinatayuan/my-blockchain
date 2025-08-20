// React核心库和状态管理
import React, { useState } from 'react'
// HTTP请求库
import axios from 'axios'

// 钱包数据接口，定义钱包的基本属性
interface Wallet {
  name: string // 钱包名称
  address: string // 钱包地址
  publicKey: string // 公钥
  balance: number // 余额
}

// 消息提示接口，用于显示操作反馈
interface Message {
  text: string // 消息文本
  type: 'info' | 'success' | 'error' // 消息类型
}

// WalletManager组件的props接口
interface WalletManagerProps {
  wallets: Wallet[] // 钱包列表
  onWalletsChange: () => void // 钱包变化时的回调函数
}

/**
 * 钱包管理组件
 * 提供钱包的创建、删除、代币水龙头领取等功能
 * 显示钱包列表和统计信息
 */
const WalletManager: React.FC<WalletManagerProps> = ({
  wallets, // 从父组件传入的钱包列表
  onWalletsChange // 钱包数据变化时调用的回调函数
}) => {
  // 新钱包名称输入状态
  const [newWalletName, setNewWalletName] = useState<string>('')
  // 水龙头领取数量输入状态
  const [mintAmount, setMintAmount] = useState<string>('')
  // 选中的钱包名称状态
  const [selectedWallet, setSelectedWallet] = useState<string>('')
  // 加载状态，用于显示操作进度
  const [loading, setLoading] = useState<boolean>(false)
  // 消息提示状态，用于显示操作反馈
  const [message, setMessage] = useState<Message | null>(null)

  /**
   * 创建新钱包
   * 发送POST请求到后端API创建新的钱包，包含椭圆曲线密钥对生成
   * @param e 表单提交事件
   */
  const createWallet = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault() // 阻止表单默认提交行为
    const trimmedName = newWalletName.trim() // 去除首尾空格

    // 验证钱包名称
    if (!trimmedName) {
      setMessage({ text: '请输入钱包名称', type: 'error' })
      return
    }

    if (trimmedName.length < 2) {
      setMessage({ text: '钱包名称至少需要 2 个字符', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: `正在创建钱包 "${trimmedName}"...`, type: 'info' })

    try {
      // 调用后端API创建钱包，后端会生成椭圆曲线密钥对
      await axios.post('/api/wallets', { name: trimmedName })
      setMessage({
        text: `✨ 钱包 "${trimmedName}" 创建成功！`,
        type: 'success'
      })
      setNewWalletName('') // 清空输入框

      // 延迟刷新钱包列表，等待后端处理完成
      setTimeout(() => {
        onWalletsChange()
      }, 500)
    } catch (error: any) {
      // 处理创建失败的情况
      setMessage({
        text: error.response?.data?.error || '创建钱包失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setLoading(false) // 无论成功失败都要重置加载状态
    }
  }

  /**
   * 删除钱包
   * 删除指定的钱包，如果钱包有余额会显示警告确认
   * @param walletName 要删除的钱包名称
   */
  const deleteWallet = async (walletName: string): Promise<void> => {
    const wallet = wallets.find((w) => w.name === walletName)
    const hasBalance = wallet && wallet.balance > 0

    // 构建确认消息，如果有余额则显示警告
    let confirmMessage = `确定要删除钱包 "${walletName}" 吗？`
    if (hasBalance) {
      confirmMessage += `\n\n⚠️ 警告：该钱包还有 ${wallet.balance} 个代币，删除后将无法找回！`
    }

    // 用户确认删除操作
    if (!window.confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    setMessage({ text: `正在删除钱包 "${walletName}"...`, type: 'info' })

    try {
      // 调用后端API删除钱包
      await axios.delete(`/api/wallets/${walletName}`)
      setMessage({
        text: `✓ 钱包 "${walletName}" 已成功删除`,
        type: 'success'
      })

      // 延迟刷新钱包列表
      setTimeout(() => {
        onWalletsChange()
      }, 500)
    } catch (error: any) {
      // 处理删除失败的情况
      setMessage({
        text: error.response?.data?.error || '删除钱包失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 请求代币水龙头
   * 向指定钱包免费发放测试代币，用于演示和测试目的
   * @param e 表单提交事件
   */
  const requestFaucet = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedWallet) {
      setMessage({ text: '请选择钱包', type: 'error' })
      return
    }

    // 获取领取数量，默认1000代币
    const amount = parseInt(mintAmount) || 1000
    setLoading(true)
    setMessage({ text: '正在从水龙头领取代币...', type: 'info' })

    try {
      // 调用后端API请求水龙头代币
      const response = await axios.post('/api/faucet', {
        walletName: selectedWallet,
        amount: amount
      })

      setMessage({
        text: `🎉 领取成功！${selectedWallet} 获得 ${amount} 代币`,
        type: 'success'
      })

      // 清空表单
      setMintAmount('')
      setSelectedWallet('')

      // 延迟刷新钱包数据以显示新余额
      setTimeout(() => {
        onWalletsChange()
      }, 500)
    } catch (error: any) {
      // 处理请求失败的情况
      setMessage({
        text: error.response?.data?.error || '水龙头请求失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 复制文本到剪贴板
   * 使用浏览器原生API复制钱包地址到剪贴板
   * @param text 要复制的文本内容
   */
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
    setMessage({ text: '地址已复制到剪贴板！', type: 'info' })
  }

  return (
    <div>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className="card">
        <h2>➕ 创建新钱包</h2>
        <form onSubmit={createWallet}>
          <div className="form-group">
            <label htmlFor="walletName">钱包名称</label>
            <input
              id="walletName"
              type="text"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="输入钱包名称 (例如: 小明, 小红, 小强)"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn"
            disabled={loading}
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
                创建中...
              </>
            ) : (
              '➕ 创建钱包'
            )}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>💧 水龙头领取</h2>
        <form onSubmit={requestFaucet}>
          <div className="form-group">
            <label htmlFor="mintWallet">选择领取钱包</label>
            <select
              id="mintWallet"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              disabled={loading}
            >
              <option value="">请选择钱包...</option>
              {wallets.map((wallet) => (
                <option key={wallet.name} value={wallet.name}>
                  {wallet.name} (余额: {wallet.balance})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="mintAmount">领取数量</label>
            <input
              id="mintAmount"
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="输入领取数量（默认1000）"
              min="1"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn success"
            disabled={loading}
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
                领取中...
              </>
            ) : (
              '💰 领取代币'
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

      <div className="card">
        <h2>👛 您的钱包 ({wallets.length})</h2>
        {wallets.length === 0 ? (
          <div className="no-data">
            尚未创建钱包。请在上方创建您的第一个钱包！
          </div>
        ) : (
          <div className="wallet-list">
            {wallets.map((wallet) => (
              <div key={wallet.name} className="wallet-card">
                <div className="wallet-name">{wallet.name}</div>
                <div
                  className="wallet-address"
                  onClick={() => copyToClipboard(wallet.address)}
                  style={{ cursor: 'pointer' }}
                  title="点击复制地址"
                >
                  📋 {wallet.address}
                </div>
                <div className="wallet-balance">💰 {wallet.balance} 代币</div>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    className="btn danger"
                    onClick={() => deleteWallet(wallet.name)}
                    disabled={loading}
                    style={{
                      position: 'relative',
                      minHeight: '36px'
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            border: '2px solid transparent',
                            borderTop: '2px solid currentColor',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: '6px'
                          }}
                        ></span>
                        删除中...
                      </>
                    ) : (
                      '🗑️ 删除钱包'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {wallets.length > 0 && (
        <div className="card">
          <h2>📊 钱包统计</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{wallets.length}</div>
              <div className="stat-label">钱包总数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {wallets.reduce((sum, wallet) => sum + wallet.balance, 0)}
              </div>
              <div className="stat-label">总余额</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.max(...wallets.map((w) => w.balance))}
              </div>
              <div className="stat-label">最高余额</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(
                  wallets.reduce((sum, wallet) => sum + wallet.balance, 0) /
                  wallets.length
                ).toFixed(2)}
              </div>
              <div className="stat-label">平均余额</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletManager
