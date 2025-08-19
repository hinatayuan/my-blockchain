import { useState, useCallback } from 'react';
import axios from 'axios';
import { Wallet } from '../types';

export const useWallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取所有钱包
  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/wallets');
      const walletsData = response.data.data || response.data;
      setWallets(walletsData);
    } catch (error: any) {
      console.error('获取钱包列表失败:', error);
      setError('获取钱包列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建钱包
  const createWallet = useCallback(async (name: string, mnemonic?: string) => {
    try {
      const response = await axios.post('/api/wallets', {
        name,
        mnemonic
      });
      const newWallet = response.data.data || response.data;
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '创建钱包失败');
    }
  }, []);

  // 删除钱包
  const deleteWallet = useCallback(async (name: string) => {
    try {
      await axios.delete(`/api/wallets/${encodeURIComponent(name)}`);
      setWallets(prev => prev.filter(wallet => wallet.name !== name));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '删除钱包失败');
    }
  }, []);

  // 获取单个钱包信息
  const getWallet = useCallback(async (name: string) => {
    try {
      const response = await axios.get(`/api/wallets/${encodeURIComponent(name)}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '获取钱包信息失败');
    }
  }, []);

  // 根据名称查找钱包
  const findWalletByName = useCallback((name: string): Wallet | undefined => {
    return wallets.find(wallet => wallet.name === name);
  }, [wallets]);

  // 根据地址查找钱包
  const findWalletByAddress = useCallback((address: string): Wallet | undefined => {
    return wallets.find(wallet => wallet.address === address);
  }, [wallets]);

  // 更新钱包余额
  const updateWalletBalance = useCallback((address: string, balance: number) => {
    setWallets(prev => 
      prev.map(wallet => 
        wallet.address === address 
          ? { ...wallet, balance }
          : wallet
      )
    );
  }, []);

  // 批量更新钱包余额
  const updateWalletsBalances = useCallback((balanceUpdates: Array<{address: string, balance: number}>) => {
    setWallets(prev => 
      prev.map(wallet => {
        const update = balanceUpdates.find(u => u.address === wallet.address);
        return update ? { ...wallet, balance: update.balance } : wallet;
      })
    );
  }, []);

  return {
    wallets,
    loading,
    error,
    fetchWallets,
    createWallet,
    deleteWallet,
    getWallet,
    findWalletByName,
    findWalletByAddress,
    updateWalletBalance,
    updateWalletsBalances,
    setError
  };
};