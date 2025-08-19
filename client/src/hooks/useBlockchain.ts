import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BlockchainData, BlockchainInfo, Block, Transaction, Wallet } from '../types';

export const useBlockchain = () => {
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    info: {
      height: 0,
      difficulty: 0,
      totalSupply: 0,
      pendingTransactions: 0,
      isValid: true,
      lastBlockHash: '',
      networkHashRate: 0
    },
    blocks: [],
    transactions: [],
    pendingTransactions: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取区块链信息
  const fetchBlockchainInfo = useCallback(async (): Promise<BlockchainInfo | null> => {
    try {
      const response = await axios.get('/api/blockchain/info');
      return response.data.data || response.data;
    } catch (error) {
      console.error('获取区块链信息失败:', error);
      setError('获取区块链信息失败');
      return null;
    }
  }, []);

  // 获取所有区块
  const fetchBlocks = useCallback(async (): Promise<Block[]> => {
    try {
      const response = await axios.get('/api/blockchain/blocks');
      return response.data.data || response.data;
    } catch (error) {
      console.error('获取区块列表失败:', error);
      setError('获取区块列表失败');
      return [];
    }
  }, []);

  // 获取所有交易
  const fetchTransactions = useCallback(async (): Promise<Transaction[]> => {
    try {
      const response = await axios.get('/api/blockchain/transactions');
      return response.data.data || response.data;
    } catch (error) {
      console.error('获取交易列表失败:', error);
      setError('获取交易列表失败');
      return [];
    }
  }, []);

  // 获取待处理交易
  const fetchPendingTransactions = useCallback(async (): Promise<Transaction[]> => {
    try {
      const response = await axios.get('/api/blockchain/pending-transactions');
      return response.data.data || response.data;
    } catch (error) {
      console.error('获取待处理交易失败:', error);
      setError('获取待处理交易失败');
      return [];
    }
  }, []);

  // 获取完整的区块链数据
  const fetchBlockchainData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [info, blocks, transactions, pendingTransactions] = await Promise.all([
        fetchBlockchainInfo(),
        fetchBlocks(),
        fetchTransactions(),
        fetchPendingTransactions()
      ]);

      setBlockchainData({
        info: info || blockchainData.info,
        blocks: blocks || [],
        transactions: transactions || [],
        pendingTransactions: pendingTransactions || []
      });
    } catch (error) {
      console.error('获取区块链数据失败:', error);
      setError('获取区块链数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchBlockchainInfo, fetchBlocks, fetchTransactions, fetchPendingTransactions, blockchainData.info]);

  // 创建交易
  const createTransaction = useCallback(async (fromWalletName: string, to: string, amount: number, memo?: string) => {
    try {
      const response = await axios.post('/api/transactions', {
        fromWalletName,
        to,
        amount,
        memo
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '创建交易失败');
    }
  }, []);

  // 挖矿/锻造区块
  const mineBlock = useCallback(async (minerWalletName?: string) => {
    try {
      const response = await axios.post('/api/mine', {
        minerWalletName
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '区块锻造失败');
    }
  }, []);

  // 使用水龙头
  const useFaucet = useCallback(async (walletName: string, amount: number = 1000) => {
    try {
      const response = await axios.post('/api/faucet', {
        walletName,
        amount
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '水龙头操作失败');
    }
  }, []);

  // 铸造代币
  const mintTokens = useCallback(async (walletName: string, amount: number) => {
    try {
      const response = await axios.post('/api/mint', {
        walletName,
        amount
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '代币铸造失败');
    }
  }, []);

  return {
    blockchainData,
    loading,
    error,
    fetchBlockchainData,
    createTransaction,
    mineBlock,
    useFaucet,
    mintTokens,
    setError
  };
};