import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CosmJSIntegration = () => {
  const [connectionInfo, setConnectionInfo] = useState({
    connected: false,
    address: null,
    hasWallet: false
  });
  const [rpcEndpoint, setRpcEndpoint] = useState('https://rpc.cosmos.directory/cosmoshub');
  const [mnemonic, setMnemonic] = useState('');
  const [balance, setBalance] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [sendForm, setSendForm] = useState({
    to: '',
    amount: '',
    denom: 'uatom',
    memo: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await axios.get('/api/cosmjs/info');
      setConnectionInfo(response.data);
      
      if (response.data.connected) {
        await fetchBalance();
        await fetchNetworkInfo();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connect = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/cosmjs/connect', {
        rpcEndpoint,
        mnemonic: mnemonic || undefined
      });
      
      setConnectionInfo({
        connected: true,
        address: response.data.address,
        hasWallet: true
      });
      
      setMessage({ 
        text: `Successfully connected! Address: ${response.data.address}`, 
        type: 'success' 
      });
      
      if (!mnemonic && response.data.mnemonic) {
        setMessage({ 
          text: `New wallet created! Save this mnemonic: ${response.data.mnemonic}`, 
          type: 'info' 
        });
      }
      
      await fetchBalance();
      await fetchNetworkInfo();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to connect to Cosmos network', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      await axios.post('/api/cosmjs/disconnect');
      setConnectionInfo({
        connected: false,
        address: null,
        hasWallet: false
      });
      setBalance(null);
      setNetworkInfo(null);
      setMessage({ text: 'Disconnected from Cosmos network', type: 'info' });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to disconnect', 
        type: 'error' 
      });
    }
  };

  const fetchBalance = async () => {
    if (!connectionInfo.connected) return;
    
    try {
      const response = await axios.get('/api/cosmjs/balance');
      setBalance(response.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchNetworkInfo = async () => {
    if (!connectionInfo.connected) return;
    
    try {
      const response = await axios.get('/api/cosmjs/network-info');
      setNetworkInfo(response.data);
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  };

  const sendTokens = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/cosmjs/send', sendForm);
      
      setMessage({ 
        text: `Transaction successful! Hash: ${response.data.transactionHash}`, 
        type: 'success' 
      });
      
      setSendForm({
        to: '',
        amount: '',
        denom: 'uatom',
        memo: ''
      });
      
      await fetchBalance();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to send transaction', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateTransaction = async () => {
    if (!sendForm.to || !sendForm.amount) {
      setMessage({ text: 'Please fill in recipient and amount', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.post('/api/cosmjs/simulate', {
        to: sendForm.to,
        amount: sendForm.amount,
        denom: sendForm.denom
      });
      
      setMessage({ 
        text: `Estimated gas: ${response.data.gasUsed}, Fee: ${response.data.estimatedFee}`, 
        type: 'info' 
      });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to simulate transaction', 
        type: 'error' 
      });
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
        <h2>🌌 CosmJS Connection</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span 
            className={`status-indicator ${connectionInfo.connected ? 'connected' : 'disconnected'}`}
          ></span>
          <span>
            Status: {connectionInfo.connected ? 'Connected' : 'Disconnected'}
          </span>
          {connectionInfo.connected && connectionInfo.address && (
            <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Address: {connectionInfo.address.substring(0, 20)}...
            </span>
          )}
        </div>

        {!connectionInfo.connected ? (
          <form onSubmit={connect}>
            <div className="form-group">
              <label htmlFor="rpcEndpoint">RPC Endpoint</label>
              <input
                id="rpcEndpoint"
                type="url"
                value={rpcEndpoint}
                onChange={(e) => setRpcEndpoint(e.target.value)}
                placeholder="Enter Cosmos RPC endpoint"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mnemonic">Mnemonic (optional)</label>
              <textarea
                id="mnemonic"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your 12/24 word mnemonic phrase (leave empty to generate new)"
                rows="3"
                disabled={loading}
              />
              <small style={{ color: '#666' }}>
                Leave empty to generate a new wallet
              </small>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect to Cosmos'}
            </button>
          </form>
        ) : (
          <div>
            <button className="btn secondary" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      {connectionInfo.connected && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">
                {balance ? `${balance.amount}` : '0'}
              </div>
              <div className="stat-label">Balance ({balance?.denom || 'uatom'})</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {networkInfo ? networkInfo.height : '0'}
              </div>
              <div className="stat-label">Block Height</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {networkInfo ? networkInfo.chainId.substring(0, 10) : 'N/A'}
              </div>
              <div className="stat-label">Chain ID</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {connectionInfo.address ? connectionInfo.address.substring(0, 8) : 'N/A'}
              </div>
              <div className="stat-label">Address</div>
            </div>
          </div>

          <div className="card">
            <h2>💸 Send Tokens</h2>
            <form onSubmit={sendTokens}>
              <div className="form-group">
                <label htmlFor="sendTo">Recipient Address</label>
                <input
                  id="sendTo"
                  type="text"
                  value={sendForm.to}
                  onChange={(e) => setSendForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="Enter recipient cosmos address"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sendAmount">Amount</label>
                <input
                  id="sendAmount"
                  type="number"
                  value={sendForm.amount}
                  onChange={(e) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  min="1"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sendDenom">Denomination</label>
                <select
                  id="sendDenom"
                  value={sendForm.denom}
                  onChange={(e) => setSendForm(prev => ({ ...prev, denom: e.target.value }))}
                  disabled={loading}
                >
                  <option value="uatom">uatom</option>
                  <option value="atom">atom</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sendMemo">Memo (optional)</label>
                <input
                  id="sendMemo"
                  type="text"
                  value={sendForm.memo}
                  onChange={(e) => setSendForm(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="Enter memo"
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Tokens'}
                </button>
                <button 
                  type="button" 
                  className="btn secondary"
                  onClick={simulateTransaction}
                  disabled={loading}
                >
                  Simulate
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2>ℹ️ Wallet Information</h2>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#666' }}>
              <p><strong>Address:</strong> {connectionInfo.address}</p>
              <p><strong>Balance:</strong> {balance ? `${balance.amount} ${balance.denom}` : 'Loading...'}</p>
              {networkInfo && (
                <>
                  <p><strong>Chain ID:</strong> {networkInfo.chainId}</p>
                  <p><strong>Latest Height:</strong> {networkInfo.height}</p>
                </>
              )}
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <button 
                className="btn secondary" 
                onClick={fetchBalance}
                disabled={loading}
              >
                Refresh Balance
              </button>
              <button 
                className="btn secondary" 
                onClick={fetchNetworkInfo}
                disabled={loading}
                style={{ marginLeft: '0.5rem' }}
              >
                Refresh Network Info
              </button>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h2>🔗 CosmJS Integration Guide</h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <h4>What is CosmJS?</h4>
          <p>CosmJS is a TypeScript/JavaScript library for interacting with Cosmos SDK-based blockchains. It provides tools for:</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Creating and managing wallets</li>
            <li>Signing and broadcasting transactions</li>
            <li>Querying blockchain state</li>
            <li>Interacting with smart contracts</li>
          </ul>

          <h4>Features Demonstrated:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Wallet Connection:</strong> Connect with existing mnemonic or generate new wallet</li>
            <li><strong>Balance Checking:</strong> Query account balances on Cosmos Hub</li>
            <li><strong>Token Transfers:</strong> Send ATOM tokens to other addresses</li>
            <li><strong>Transaction Simulation:</strong> Estimate gas costs before sending</li>
            <li><strong>Network Information:</strong> View chain ID and current block height</li>
          </ul>

          <h4>Testing Networks:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Cosmos Hub:</strong> https://rpc.cosmos.directory/cosmoshub</li>
            <li><strong>Osmosis:</strong> https://rpc.osmosis.zone</li>
            <li><strong>Juno:</strong> https://rpc.juno.strange.love</li>
          </ul>

          <div className="alert info" style={{ marginTop: '1rem' }}>
            <strong>Note:</strong> This integration connects to real Cosmos networks. Be careful with real tokens and private keys!
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmJSIntegration;