import React, { useState } from 'react';
import { TransactionManagerProps, TransactionFormData } from '../types';
import { formatTokenAmount, formatAddress } from '../utils/formatters';
import { validateAmount, validateAddress, validateMemo, validateSufficientBalance } from '../utils/validators';
import { useBlockchain } from '../hooks/useBlockchain';

const TransactionManager: React.FC<TransactionManagerProps> = ({ wallets, onTransactionCreate }) => {
  const { createTransaction, useFaucet, loading } = useBlockchain();
  const [formData, setFormData] = useState<TransactionFormData>({
    fromWalletName: '',
    to: '',
    amount: 0,
    memo: ''
  });
  const [faucetData, setFaucetData] = useState({ walletName: '', amount: 1000 });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'transfer' | 'faucet'>('transfer');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // 清除错误信息
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleFaucetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFaucetData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const validateTransactionForm = (): boolean => {
    const newErrors: string[] = [];

    // 验证发送方钱包
    if (!formData.fromWalletName) {
      newErrors.push('请选择发送方钱包');
    }

    // 验证接收地址
    const addressValidation = validateAddress(formData.to);
    if (!addressValidation.isValid) {
      newErrors.push(...addressValidation.errors);
    }

    // 验证金额
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      newErrors.push(...amountValidation.errors);
    }

    // 验证备注
    if (formData.memo) {
      const memoValidation = validateMemo(formData.memo);
      if (!memoValidation.isValid) {
        newErrors.push(...memoValidation.errors);
      }
    }

    // 验证余额
    if (formData.fromWalletName && formData.amount > 0) {
      const senderWallet = wallets.find(w => w.name === formData.fromWalletName);
      if (senderWallet) {
        const balanceValidation = validateSufficientBalance(senderWallet.balance, formData.amount);
        if (!balanceValidation.isValid) {
          newErrors.push(...balanceValidation.errors);
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    if (!validateTransactionForm()) {
      return;
    }

    try {
      await createTransaction(
        formData.fromWalletName,
        formData.to,
        formData.amount,
        formData.memo || undefined
      );
      
      setSuccessMessage(`成功发送 ${formatTokenAmount(formData.amount)} 代币到 ${formatAddress(formData.to)}`);
      setFormData({
        fromWalletName: '',
        to: '',
        amount: 0,
        memo: ''
      });
      onTransactionCreate();
    } catch (error: any) {
      setErrors([error.message || '创建交易失败']);
    }
  };

  const handleFaucetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    if (!faucetData.walletName) {
      setErrors(['请选择钱包']);
      return;
    }

    if (faucetData.amount <= 0 || faucetData.amount > 10000) {
      setErrors(['水龙头金额必须在1-10000之间']);
      return;
    }

    try {
      await useFaucet(faucetData.walletName, faucetData.amount);
      setSuccessMessage(`成功从水龙头获得 ${formatTokenAmount(faucetData.amount)} 代币`);
      setFaucetData({ walletName: '', amount: 1000 });
      onTransactionCreate();
    } catch (error: any) {
      setErrors([error.message || '水龙头操作失败']);
    }
  };

  const quickFillAddress = (walletName: string) => {
    const wallet = wallets.find(w => w.name === walletName);
    if (wallet) {
      setFormData(prev => ({ ...prev, to: wallet.address }));
    }
  };

  const selectedWallet = wallets.find(w => w.name === formData.fromWalletName);

  return (
    <div>
      <div className="card">
        <div className="tab-header">
          <button 
            className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            💸 发送交易
          </button>
          <button 
            className={`tab ${activeTab === 'faucet' ? 'active' : ''}`}
            onClick={() => setActiveTab('faucet')}
          >
            🚰 测试水龙头
          </button>
        </div>

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

        {activeTab === 'transfer' && (
          <div>
            <h2>💸 发送交易</h2>
            
            <form onSubmit={handleTransactionSubmit}>
              <div className="form-group">
                <label htmlFor="fromWallet">发送方钱包:</label>
                <select
                  id="fromWallet"
                  name="fromWalletName"
                  value={formData.fromWalletName}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                >
                  <option value="">请选择钱包</option>
                  {wallets.map((wallet, index) => (
                    <option key={wallet.id || index} value={wallet.name}>
                      {wallet.name} ({formatTokenAmount(wallet.balance)} 代币)
                    </option>
                  ))}
                </select>
                {selectedWallet && (
                  <small className="form-hint">
                    当前余额: {formatTokenAmount(selectedWallet.balance)} 代币
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="toAddress">接收地址:</label>
                <input
                  type="text"
                  id="toAddress"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="请输入接收方地址"
                  disabled={loading}
                  required
                />
                <div className="quick-fill">
                  <span>快速填入:</span>
                  {wallets.slice(0, 3).map((wallet, index) => (
                    <button
                      key={wallet.id || index}
                      type="button"
                      className="btn-small"
                      onClick={() => quickFillAddress(wallet.name)}
                    >
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="amount">转账金额:</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="请输入转账金额"
                  min="0"
                  step="0.01"
                  disabled={loading}
                  required
                />
                {selectedWallet && formData.amount > 0 && (
                  <small className={`form-hint ${
                    formData.amount > selectedWallet.balance ? 'error' : 'success'
                  }`}>
                    {formData.amount > selectedWallet.balance 
                      ? '余额不足' 
                      : `剩余余额: ${formatTokenAmount(selectedWallet.balance - formData.amount)} 代币`
                    }
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="memo">备注 (可选):</label>
                <textarea
                  id="memo"
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  placeholder="请输入交易备注"
                  rows={3}
                  maxLength={200}
                  disabled={loading}
                />
                <small className="form-hint">
                  {formData.memo ? formData.memo.length : 0}/200 字符
                </small>
              </div>

              <button 
                type="submit" 
                disabled={
                  loading || 
                  !formData.fromWalletName || 
                  !formData.to || 
                  !formData.amount ||
                  (selectedWallet && formData.amount > selectedWallet.balance)
                }
              >
                {loading ? '发送中...' : '发送交易'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'faucet' && (
          <div>
            <h2>🚰 测试水龙头</h2>
            <p className="description">
              测试水龙头可以为您的钱包免费提供测试代币，用于体验区块链功能。
            </p>
            
            <form onSubmit={handleFaucetSubmit}>
              <div className="form-group">
                <label htmlFor="faucetWallet">目标钱包:</label>
                <select
                  id="faucetWallet"
                  name="walletName"
                  value={faucetData.walletName}
                  onChange={handleFaucetInputChange}
                  disabled={loading}
                  required
                >
                  <option value="">请选择钱包</option>
                  {wallets.map((wallet, index) => (
                    <option key={wallet.id || index} value={wallet.name}>
                      {wallet.name} ({formatTokenAmount(wallet.balance)} 代币)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="faucetAmount">获取金额:</label>
                <input
                  type="number"
                  id="faucetAmount"
                  name="amount"
                  value={faucetData.amount}
                  onChange={handleFaucetInputChange}
                  min="1"
                  max="10000"
                  step="1"
                  disabled={loading}
                  required
                />
                <small className="form-hint">
                  每次最多可获取 10,000 代币
                </small>
              </div>

              <div className="quick-amounts">
                <span>快速选择:</span>
                {[100, 500, 1000, 5000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    className="btn-small"
                    onClick={() => setFaucetData(prev => ({ ...prev, amount }))}
                  >
                    {formatTokenAmount(amount)}
                  </button>
                ))}
              </div>

              <button 
                type="submit" 
                disabled={loading || !faucetData.walletName || faucetData.amount <= 0}
              >
                {loading ? '处理中...' : '获取测试代币'}
              </button>
            </form>
          </div>
        )}
      </div>

      {wallets.length === 0 && (
        <div className="card info">
          <h3>📝 提示</h3>
          <p>您需要先创建钱包才能进行交易。请前往 "钱包管理" 页面创建您的第一个钱包。</p>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;