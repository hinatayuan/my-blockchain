import React, { useState } from 'react';
import { WalletManagerProps, WalletFormData } from '../types';
import { formatTokenAmount, formatAddress, formatTime } from '../utils/formatters';
import { validateWalletName } from '../utils/validators';
import { useWallets } from '../hooks/useWallets';

const WalletManager: React.FC<WalletManagerProps> = ({ wallets, onWalletsChange }) => {
  const { createWallet, deleteWallet, loading } = useWallets();
  const [formData, setFormData] = useState<WalletFormData>({
    name: '',
    mnemonic: ''
  });
  const [showMnemonicInput, setShowMnemonicInput] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除错误信息
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    // 验证输入
    const nameValidation = validateWalletName(formData.name);
    if (!nameValidation.isValid) {
      setErrors(nameValidation.errors);
      return;
    }

    // 检查钱包名称是否已存在
    if (wallets.some(wallet => wallet.name === formData.name)) {
      setErrors(['钱包名称已存在']);
      return;
    }

    try {
      const mnemonic = showMnemonicInput && formData.mnemonic ? formData.mnemonic : undefined;
      await createWallet(formData.name, mnemonic);
      
      setSuccessMessage(`钱包 "${formData.name}" 创建成功！`);
      setFormData({ name: '', mnemonic: '' });
      setShowMnemonicInput(false);
      onWalletsChange();
    } catch (error: any) {
      setErrors([error.message || '创建钱包失败']);
    }
  };

  const handleDeleteWallet = async (walletName: string) => {
    if (!window.confirm(`确定要删除钱包 "${walletName}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await deleteWallet(walletName);
      setSuccessMessage(`钱包 "${walletName}" 已删除`);
      onWalletsChange();
    } catch (error: any) {
      setErrors([error.message || '删除钱包失败']);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('地址已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>👛 创建新钱包</h2>
        
        {errors.length > 0 && (
          <div className="alert error">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
        
        {successMessage && (
          <div className="alert success">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="walletName">钱包名称:</label>
            <input
              type="text"
              id="walletName"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="请输入钱包名称"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={showMnemonicInput}
                onChange={(e) => setShowMnemonicInput(e.target.checked)}
                disabled={loading}
              />
              从助记词导入钱包
            </label>
          </div>

          {showMnemonicInput && (
            <div className="form-group">
              <label htmlFor="mnemonic">助记词:</label>
              <textarea
                id="mnemonic"
                name="mnemonic"
                value={formData.mnemonic}
                onChange={handleInputChange}
                placeholder="请输入12或24个助记词，用空格分隔"
                rows={3}
                disabled={loading}
              />
              <small className="form-hint">
                助记词用于恢复钱包，请确保输入正确
              </small>
            </div>
          )}

          <button type="submit" disabled={loading || !formData.name.trim()}>
            {loading ? '创建中...' : (showMnemonicInput ? '导入钱包' : '创建钱包')}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>📊 钱包列表</h2>
        
        {wallets.length === 0 ? (
          <div className="no-data">尚未创建任何钱包</div>
        ) : (
          <div className="wallet-grid">
            {wallets.map((wallet, index) => (
              <div key={wallet.id || index} className="wallet-card detailed">
                <div className="wallet-header">
                  <h3 className="wallet-name">{wallet.name}</h3>
                  <div className="wallet-balance">
                    {formatTokenAmount(wallet.balance)} 代币
                  </div>
                </div>
                
                <div className="wallet-info">
                  <div className="info-row">
                    <span className="label">地址:</span>
                    <span className="value address" onClick={() => copyToClipboard(wallet.address)}>
                      {formatAddress(wallet.address)}
                      <button className="copy-btn" title="复制地址">
                        📋
                      </button>
                    </span>
                  </div>
                  
                  {wallet.createdAt && (
                    <div className="info-row">
                      <span className="label">创建时间:</span>
                      <span className="value">{formatTime(wallet.createdAt)}</span>
                    </div>
                  )}
                  
                  <div className="info-row">
                    <span className="label">公钥:</span>
                    <span className="value hash">
                      {formatAddress(wallet.publicKey, 12)}
                    </span>
                  </div>
                </div>
                
                <div className="wallet-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => copyToClipboard(wallet.address)}
                  >
                    复制地址
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteWallet(wallet.name)}
                    disabled={loading}
                  >
                    删除钱包
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {wallets.length > 0 && (
          <div className="wallet-summary">
            <h3>钱包统计</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="label">总钱包数:</span>
                <span className="value">{wallets.length}</span>
              </div>
              <div className="stat">
                <span className="label">总余额:</span>
                <span className="value">
                  {formatTokenAmount(wallets.reduce((sum, wallet) => sum + wallet.balance, 0))} 代币
                </span>
              </div>
              <div className="stat">
                <span className="label">活跃钱包:</span>
                <span className="value">
                  {wallets.filter(wallet => wallet.balance > 0).length}
                </span>
              </div>
              <div className="stat">
                <span className="label">平均余额:</span>
                <span className="value">
                  {formatTokenAmount(
                    wallets.length > 0 
                      ? wallets.reduce((sum, wallet) => sum + wallet.balance, 0) / wallets.length 
                      : 0
                  )} 代币
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManager;