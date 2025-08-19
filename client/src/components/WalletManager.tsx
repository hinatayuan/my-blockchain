import React, { useState } from 'react'
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

interface WalletManagerProps {
  wallets: Wallet[]
  onWalletsChange: () => void
}

const WalletManager: React.FC<WalletManagerProps> = ({
  wallets,
  onWalletsChange
}) => {
  const [newWalletName, setNewWalletName] = useState<string>('')
  const [mintAmount, setMintAmount] = useState<string>('')
  const [selectedWallet, setSelectedWallet] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<Message | null>(null)

  const createWallet = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmedName = newWalletName.trim()

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
      await axios.post('/api/wallets', { name: trimmedName })
      setMessage({
        text: `✨ 钱包 "${trimmedName}" 创建成功！`,
        type: 'success'
      })
      setNewWalletName('')

      // 自动刷新钱包列表
      setTimeout(() => {
        onWalletsChange()
      }, 500)
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.error || '创建钱包失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteWallet = async (walletName: string): Promise<void> => {
    const wallet = wallets.find((w) => w.name === walletName)
    const hasBalance = wallet && wallet.balance > 0

    let confirmMessage = `确定要删除钱包 "${walletName}" 吗？`
    if (hasBalance) {
      confirmMessage += `\n\n⚠️ 警告：该钱包还有 ${wallet.balance} 个代币，删除后将无法找回！`
    }

    if (!window.confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    setMessage({ text: `正在删除钱包 "${walletName}"...`, type: 'info' })

    try {
      await axios.delete(`/api/wallets/${walletName}`)
      setMessage({
        text: `✓ 钱包 "${walletName}" 已成功删除`,
        type: 'success'
      })

      // 自动刷新钱包列表
      setTimeout(() => {
        onWalletsChange()
      }, 500)
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.error || '删除钱包失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const requestFaucet = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedWallet) {
      setMessage({ text: '请选择钱包', type: 'error' })
      return
    }

    const amount = parseInt(mintAmount) || 1000
    setLoading(true)
    setMessage({ text: '正在从水龙头领取代币...', type: 'info' })

    try {
      const response = await axios.post('/api/faucet', {
        walletName: selectedWallet,
        amount: amount
      })

      setMessage({
        text: `🎉 领取成功！${selectedWallet} 获得 ${amount} 代币`,
        type: 'success'
      })

      setMintAmount('')
      setSelectedWallet('')

      // 自动刷新钱包数据
      setTimeout(() => {
        onWalletsChange()
      }, 500)
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.error || '水龙头请求失败，请稍后重试',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

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
