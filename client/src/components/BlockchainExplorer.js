import React, { useState } from 'react';

const BlockchainExplorer = ({ blockchainData }) => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('block'); // 'block', 'transaction', 'address'

  const { info, blocks, transactions } = blockchainData;

  const filteredBlocks = blocks.filter(block => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      block.hash.toLowerCase().includes(query) ||
      block.previousHash.toLowerCase().includes(query) ||
      blocks.indexOf(block).toString().includes(query)
    );
  });

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (tx.id && tx.id.toLowerCase().includes(query)) ||
      (tx.from && tx.from.toLowerCase().includes(query)) ||
      (tx.to && tx.to.toLowerCase().includes(query)) ||
      tx.type.toLowerCase().includes(query)
    );
  });

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getBlockByIndex = (index) => {
    return blocks[index];
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{info.height || 0}</div>
          <div className="stat-label">Total Blocks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{transactions.length}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{info.difficulty || 0}</div>
          <div className="stat-label">Difficulty</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {info.isValid ? '✅ Valid' : '❌ Invalid'}
          </div>
          <div className="stat-label">Chain Status</div>
        </div>
      </div>

      <div className="card">
        <h2>🔍 搜索区块链</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select 
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={{ flex: '0 0 150px' }}
          >
            <option value="block">Search Blocks</option>
            <option value="transaction">Search Transactions</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchType === 'block' ? 'block index, hash' : 'transaction ID, address, type'}`}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {searchType === 'block' && (
        <div className="card">
          <h2>🧱 Blocks ({filteredBlocks.length})</h2>
          {filteredBlocks.length === 0 ? (
            <div className="no-data">No blocks found</div>
          ) : (
            <div className="block-list">
              {filteredBlocks.reverse().map((block, reverseIndex) => {
                const actualIndex = blocks.length - 1 - reverseIndex;
                return (
                  <div 
                    key={actualIndex} 
                    className="block-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedBlock(selectedBlock === actualIndex ? null : actualIndex)}
                  >
                    <div className="block-header">
                      <div className="block-index">Block #{actualIndex}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(block.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Hash:</strong> <code>{formatHash(block.hash)}</code>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Previous Hash:</strong> <code>{formatHash(block.previousHash)}</code>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Transactions:</strong> {block.transactions.length}
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Nonce:</strong> {block.nonce}
                    </div>

                    {selectedBlock === actualIndex && (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '1rem', 
                        background: '#f8f9fa',
                        borderRadius: '5px',
                        border: '1px solid #e1e5e9'
                      }}>
                        <h4>Block Details</h4>
                        <p><strong>Full Hash:</strong> <code style={{ wordBreak: 'break-all' }}>{block.hash}</code></p>
                        <p><strong>Previous Hash:</strong> <code style={{ wordBreak: 'break-all' }}>{block.previousHash}</code></p>
                        
                        <h4>Transactions in this Block ({block.transactions.length})</h4>
                        {block.transactions.length === 0 ? (
                          <p>No transactions in this block</p>
                        ) : (
                          <div className="transaction-list">
                            {block.transactions.map((tx, txIndex) => (
                              <div key={txIndex} className="transaction-item">
                                <div><strong>Type:</strong> {tx.type}</div>
                                <div><strong>Amount:</strong> {tx.amount} tokens</div>
                                {tx.from && <div><strong>From:</strong> {formatAddress(tx.from)}</div>}
                                {tx.to && <div><strong>To:</strong> {formatAddress(tx.to)}</div>}
                                {tx.id && <div><strong>ID:</strong> {tx.id}</div>}
                                <div><strong>Timestamp:</strong> {new Date(tx.timestamp).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {searchType === 'transaction' && (
        <div className="card">
          <h2>💳 Transactions ({filteredTransactions.length})</h2>
          {filteredTransactions.length === 0 ? (
            <div className="no-data">No transactions found</div>
          ) : (
            <div className="transaction-list">
              {filteredTransactions.reverse().map((tx, index) => (
                <div key={tx.id || index} className="transaction-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <strong>{tx.type.toUpperCase()}</strong>
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        padding: '0.2rem 0.5rem',
                        background: tx.type === 'transfer' ? '#007bff' : tx.type === 'mint' ? '#28a745' : '#6c757d',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '0.7rem'
                      }}>
                        {tx.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '1.2rem', color: '#28a745', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {tx.amount} tokens
                  </div>
                  
                  {tx.from && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>From:</strong> <code>{tx.from}</code>
                    </div>
                  )}
                  
                  {tx.to && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>To:</strong> <code>{tx.to}</code>
                    </div>
                  )}
                  
                  {tx.id && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>Transaction ID:</strong> <code>{tx.id}</code>
                    </div>
                  )}
                  
                  {tx.signature && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>Signature:</strong> <code>{formatHash(tx.signature)}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {blocks.length > 0 && (
        <div className="card">
          <h2>📊 Blockchain Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{blocks.length}</div>
              <div className="stat-label">Total Blocks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {blocks.reduce((sum, block) => sum + block.transactions.length, 0)}
              </div>
              <div className="stat-label">Total Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.round(blocks.reduce((sum, block) => sum + block.transactions.length, 0) / blocks.length * 100) / 100}
              </div>
              <div className="stat-label">Avg TXs per Block</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {formatHash(blocks[blocks.length - 1]?.hash)}
              </div>
              <div className="stat-label">Latest Block Hash</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>ℹ️ Explorer Guide</h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <h4>How to Use the Block Explorer:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Search Blocks:</strong> Find blocks by index, hash, or previous hash</li>
            <li><strong>Search Transactions:</strong> Find transactions by ID, address, or type</li>
            <li><strong>Block Details:</strong> Click on any block to view its transactions</li>
            <li><strong>Transaction Types:</strong> 
              <ul style={{ marginTop: '0.5rem' }}>
                <li><span style={{background: '#007bff', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem', marginRight: '0.5rem'}}>transfer</span>Regular transfers between wallets</li>
                <li><span style={{background: '#28a745', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem', marginRight: '0.5rem'}}>mint</span>New tokens created</li>
                <li><span style={{background: '#6c757d', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem', marginRight: '0.5rem'}}>reward</span>Mining rewards</li>
              </ul>
            </li>
            <li><strong>Hash Verification:</strong> Each block's hash is calculated from its contents</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;