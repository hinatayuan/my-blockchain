import React, { useState } from 'react';
import axios from 'axios';

const MiningPanel = ({ wallets, pendingTransactions, onBlockMined }) => {
  const [selectedMiner, setSelectedMiner] = useState('');
  const [mining, setMining] = useState(false);
  const [message, setMessage] = useState('');
  const [miningStats, setMiningStats] = useState({
    blocksMinedToday: 0,
    totalRewardsEarned: 0
  });

  const startMining = async () => {
    if (!selectedMiner) {
      setMessage({ text: '请选择矿工钱包', type: 'error' });
      return;
    }

    if (pendingTransactions.length === 0) {
      setMessage({ text: '没有待处理的交易可挖掘', type: 'error' });
      return;
    }

    const minerWallet = wallets.find(w => w.name === selectedMiner);
    if (!minerWallet) {
      setMessage({ text: '找不到选中的矿工钱包', type: 'error' });
      return;
    }

    setMining(true);
    setMessage({ text: '挖矿进行中...请稍等片刻。', type: 'info' });

    try {
      const response = await axios.post('/api/mine', {
        minerWalletName: selectedMiner
      });

      setMessage({ 
        text: `区块挖掘成功！奖励: ${selectedMiner} 获得 ${response.data.reward} 代币`, 
        type: 'success' 
      });
      
      // Update mining stats
      setMiningStats(prev => ({
        blocksMinedToday: prev.blocksMinedToday + 1,
        totalRewardsEarned: prev.totalRewardsEarned + response.data.reward
      }));

      onBlockMined();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || '挖区块失败', 
        type: 'error' 
      });
    } finally {
      setMining(false);
    }
  };

  const getMiningDifficulty = () => {
    // Simulate mining difficulty based on pending transactions
    return Math.max(2, Math.floor(pendingTransactions.length / 3) + 2);
  };

  const estimateMiningTime = () => {
    const difficulty = getMiningDifficulty();
    return `${difficulty * 2}-${difficulty * 4} seconds`;
  };

  return (
    <div>
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{pendingTransactions.length}</div>
          <div className="stat-label">待处理交易</div>
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
<strong>没有交易可挖掘！</strong><br />
            请先创建一些交易，然后回来挖掘区块。
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="minerSelect">Select Miner Wallet</label>
              <select
                id="minerSelect"
                value={selectedMiner}
                onChange={(e) => setSelectedMiner(e.target.value)}
                disabled={mining}
              >
                <option value="">Choose miner wallet...</option>
                {wallets.map((wallet) => (
                  <option key={wallet.name} value={wallet.name}>
                    {wallet.name} (Current: {wallet.balance} tokens)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '5px', 
              marginBottom: '1rem',
              border: '1px solid #e1e5e9'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Mining Information</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                <li>Mining reward: <strong>100 tokens</strong></li>
                <li>Transactions to be processed: <strong>{pendingTransactions.length}</strong></li>
                <li>Estimated mining time: <strong>{estimateMiningTime()}</strong></li>
                <li>Selected miner will receive the reward</li>
              </ul>
            </div>

            <button 
              className="btn success"
              onClick={startMining} 
              disabled={mining || !selectedMiner}
              style={{ 
                fontSize: '1.1rem', 
                padding: '1rem 2rem',
                width: '100%'
              }}
            >
              {mining ? '⛏️ Mining...' : '⛏️ Start Mining'}
            </button>
          </>
        )}
      </div>

      {pendingTransactions.length > 0 && (
        <div className="card">
          <h2>📋 Pending Transactions ({pendingTransactions.length})</h2>
          <div className="transaction-list">
            {pendingTransactions.map((tx, index) => (
              <div key={tx.id || index} className="transaction-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{tx.type.toUpperCase()}</strong>: {tx.amount} tokens
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  {tx.from ? (
                    <>From: {tx.from.substring(0, 16)}... → To: {tx.to.substring(0, 16)}...</>
                  ) : (
                    <>To: {tx.to.substring(0, 16)}... (${tx.type})</>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>📈 Mining Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{miningStats.blocksMinedToday}</div>
            <div className="stat-label">Blocks Mined</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{miningStats.totalRewardsEarned}</div>
            <div className="stat-label">Total Rewards</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>💡 Mining Guide</h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <h4>How Mining Works:</h4>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Collect Transactions:</strong> Mining processes all pending transactions</li>
            <li><strong>Solve Puzzle:</strong> The system finds a hash that meets the difficulty requirement</li>
            <li><strong>Create Block:</strong> Valid transactions are bundled into a new block</li>
            <li><strong>Earn Reward:</strong> The miner receives tokens as a reward</li>
            <li><strong>Update Chain:</strong> The new block is added to the blockchain</li>
          </ol>
          
          <h4 style={{ marginTop: '1rem' }}>Tips:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Mining time increases with difficulty</li>
            <li>More pending transactions don't slow down mining</li>
            <li>Choose any wallet to receive mining rewards</li>
            <li>Mining confirms all pending transactions at once</li>
          </ul>
        </div>
      </div>

      {wallets.length === 0 && (
        <div className="card">
          <div className="alert info">
            <strong>No wallets available!</strong><br />
            Create a wallet first to receive mining rewards. Go to the Wallets tab to get started.
          </div>
        </div>
      )}
    </div>
  );
};

export default MiningPanel;