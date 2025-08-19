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
          <div className="stat-label">总区块数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{transactions.length}</div>
          <div className="stat-label">总交易数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{info.difficulty || 0}</div>
          <div className="stat-label">雾度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {info.isValid ? '✅ 有效' : '❌ 无效'}
          </div>
          <div className="stat-label">链状态</div>
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
            <option value="block">搜索区块</option>
            <option value="transaction">搜索交易</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`搜索 ${searchType === 'block' ? '区块索引、哈希' : '交易ID、地址、类型'}`}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {searchType === 'block' && (
        <div className="card">
          <h2>🧱 区块 ({filteredBlocks.length})</h2>
          {filteredBlocks.length === 0 ? (
            <div className="no-data">未找到区块</div>
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
                      <div className="block-index">区块 #{actualIndex}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(block.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>哈希:</strong> <code>{formatHash(block.hash)}</code>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>前置哈希:</strong> <code>{formatHash(block.previousHash)}</code>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>交易数:</strong> {block.transactions.length}
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>随机数:</strong> {block.nonce}
                    </div>

                    {selectedBlock === actualIndex && (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '1rem', 
                        background: '#f8f9fa',
                        borderRadius: '5px',
                        border: '1px solid #e1e5e9'
                      }}>
                        <h4>区块详情</h4>
                        <p><strong>完整哈希:</strong> <code style={{ wordBreak: 'break-all' }}>{block.hash}</code></p>
                        <p><strong>前置哈希:</strong> <code style={{ wordBreak: 'break-all' }}>{block.previousHash}</code></p>
                        
                        <h4>此区块中的交易 ({block.transactions.length})</h4>
                        {block.transactions.length === 0 ? (
                          <p>此区块中无交易</p>
                        ) : (
                          <div className="transaction-list">
                            {block.transactions.map((tx, txIndex) => (
                              <div key={txIndex} className="transaction-item">
                                <div><strong>类型:</strong> {tx.type}</div>
                                <div><strong>数量:</strong> {tx.amount} 代币</div>
                                {tx.from && <div><strong>发送方:</strong> {formatAddress(tx.from)}</div>}
                                {tx.to && <div><strong>接收方:</strong> {formatAddress(tx.to)}</div>}
                                {tx.id && <div><strong>交易ID:</strong> {tx.id}</div>}
                                <div><strong>时间戳:</strong> {new Date(tx.timestamp).toLocaleString()}</div>
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
          <h2>💳 交易 ({filteredTransactions.length})</h2>
          {filteredTransactions.length === 0 ? (
            <div className="no-data">未找到交易</div>
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
                    {tx.amount} 代币
                  </div>
                  
                  {tx.from && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>发送方:</strong> <code>{tx.from}</code>
                    </div>
                  )}
                  
                  {tx.to && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>接收方:</strong> <code>{tx.to}</code>
                    </div>
                  )}
                  
                  {tx.id && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>交易ID:</strong> <code>{tx.id}</code>
                    </div>
                  )}
                  
                  {tx.signature && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <strong>签名:</strong> <code>{formatHash(tx.signature)}</code>
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
          <h2>📊 区块链统计</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{blocks.length}</div>
              <div className="stat-label">总区块数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {blocks.reduce((sum, block) => sum + block.transactions.length, 0)}
              </div>
              <div className="stat-label">总交易数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.round(blocks.reduce((sum, block) => sum + block.transactions.length, 0) / blocks.length * 100) / 100}
              </div>
              <div className="stat-label">平均每区块交易数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {formatHash(blocks[blocks.length - 1]?.hash)}
              </div>
              <div className="stat-label">最新区块哈希</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>ℹ️ 浏览器使用指南</h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <h4>如何使用区块浏览器:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>搜索区块:</strong> 通过索引、哈希或前置哈希查找区块</li>
            <li><strong>搜索交易:</strong> 通过ID、地址或类型查找交易</li>
            <li><strong>区块详情:</strong> 点击任意区块查看其交易</li>
            <li><strong>交易类型:</strong> 
              <ul style={{ marginTop: '0.5rem' }}>
                <li><span style={{background: '#007bff', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem', marginRight: '0.5rem'}}>转账</span>钱包间的常规转账</li>
                <li><span style={{background: '#28a745', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem', marginRight: '0.5rem'}}>铸币</span>新代币创建</li>
                <li><span style={{background: '#6c757d', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem', marginRight: '0.5rem'}}>奖励</span>挖矿奖励</li>
              </ul>
            </li>
            <li><strong>哈希验证:</strong> 每个区块的哈希都是根据其内容计算得出</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;