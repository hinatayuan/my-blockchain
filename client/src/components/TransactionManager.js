import React, { useState } from 'react';
import axios from 'axios';

const TransactionManager = ({ wallets, onTransactionCreate }) => {
  const [fromWallet, setFromWallet] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendTransaction = async (e) => {
    e.preventDefault();
    
    if (!fromWallet || !toAddress || !amount || amount <= 0) {
      setMessage({ text: '请填写所有字段并输入有效值', type: 'error' });
      return;
    }

    const senderWallet = wallets.find(w => w.name === fromWallet);
    if (!senderWallet) {
      setMessage({ text: '找不到发送者钱包', type: 'error' });
      return;
    }

    if (senderWallet.balance < parseFloat(amount)) {
      setMessage({ text: '余额不足', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/transactions', {
        fromWalletName: fromWallet,
        to: toAddress,
        amount: parseFloat(amount),
        memo: '区块链应用转账'
      });

      setMessage({ 
        text: `交易创建成功！交易ID: ${response.data.transaction.hash || response.data.transaction.id}`, 
        type: 'success' 
      });
      
      // Reset form
      setFromWallet('');
      setToAddress('');
      setAmount('');
      
      onTransactionCreate();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || '创建交易失败', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const quickSelectRecipient = (walletName) => {
    const wallet = wallets.find(w => w.name === walletName);
    if (wallet) {
      setToAddress(wallet.address);
    }
  };

  return (
    <div>
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

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
              <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
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
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                可用余额: {wallets.find(w => w.name === fromWallet)?.balance || 0} 代币
              </small>
            )}
          </div>

          <button type="submit" className="btn" disabled={loading || wallets.length === 0}>
            {loading ? '发送中...' : '发送交易'}
          </button>
        </form>
      </div>

      {wallets.length === 0 && (
        <div className="card">
          <div className="alert info">
            <strong>No wallets available!</strong><br />
            You need to create at least two wallets to send transactions. 
            Go to the Wallets tab to create your first wallet.
          </div>
        </div>
      )}

      {wallets.length > 0 && (
        <div className="card">
          <h2>📊 Transaction Helper</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{wallets.length}</div>
              <div className="stat-label">Available Wallets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {wallets.filter(w => w.balance > 0).length}
              </div>
              <div className="stat-label">Funded Wallets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {wallets.reduce((sum, wallet) => sum + wallet.balance, 0)}
              </div>
              <div className="stat-label">Total Available</div>
            </div>
          </div>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>💰 Wallet Balances</h3>
          <div className="wallet-list">
            {wallets.map((wallet) => (
              <div key={wallet.name} className="wallet-card">
                <div className="wallet-name">{wallet.name}</div>
                <div className="wallet-address">{wallet.address}</div>
                <div className="wallet-balance">{wallet.balance} tokens</div>
                {wallet.balance === 0 && (
                  <div style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    ⚠️ No funds available
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>💡 Transaction Tips</h2>
        <div style={{ color: '#666' }}>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Transactions are added to the pending pool and must be mined to be confirmed</li>
            <li>You need sufficient balance in your sender wallet</li>
            <li>Use the Mining tab to mine pending transactions and confirm them</li>
            <li>Each mined block includes a mining reward for the miner</li>
            <li>You can send tokens to any valid address, including wallets you create</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;