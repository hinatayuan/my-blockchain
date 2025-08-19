import React, { useState } from 'react';
import axios from 'axios';

const WalletManager = ({ wallets, onWalletsChange }) => {
  const [newWalletName, setNewWalletName] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      setMessage({ text: '请输入钱包名称', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/wallets', { name: newWalletName });
      setMessage({ text: `钱包 "${newWalletName}" 创建成功！`, type: 'success' });
      setNewWalletName('');
      onWalletsChange();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || '创建钱包失败', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWallet = async (walletName) => {
    if (!window.confirm(`确定要删除钱包 "${walletName}" 吗？`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/wallets/${walletName}`);
      setMessage({ text: `钱包 "${walletName}" 删除成功！`, type: 'success' });
      onWalletsChange();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || '删除钱包失败', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const requestFaucet = async (e) => {
    e.preventDefault();
    if (!selectedWallet) {
      setMessage({ text: '请选择钱包', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/faucet', { 
        walletName: selectedWallet,
        amount: parseInt(mintAmount) || 1000
      });
      setMessage({ 
        text: response.data.message, 
        type: 'success' 
      });
      setMintAmount('');
      setSelectedWallet('');
      onWalletsChange();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || '水龙头请求失败', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ text: '地址已复制到剪贴板！', type: 'info' });
  };

  return (
    <div>
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

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
          <button type="submit" className="btn" disabled={loading}>
            {loading ? '创建中...' : '创建钱包'}
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
          <button type="submit" className="btn success" disabled={loading}>
            {loading ? '请求中...' : '领取代币'}
          </button>
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
                <div className="wallet-balance">
                  💰 {wallet.balance} 代币
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="btn danger"
                    onClick={() => deleteWallet(wallet.name)}
                    disabled={loading}
                  >
                    删除钱包
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
                {Math.max(...wallets.map(w => w.balance))}
              </div>
              <div className="stat-label">最高余额</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(wallets.reduce((sum, wallet) => sum + wallet.balance, 0) / wallets.length).toFixed(2)}
              </div>
              <div className="stat-label">平均余额</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;