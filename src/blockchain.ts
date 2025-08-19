import { Block } from './block';
import { Transaction } from './transaction';
import { CryptoUtils } from './crypto';
import { BlockchainInfo, BlockData, Transaction as ITransaction } from './types';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public pendingTransactions: Transaction[];
  public miningReward: number;
  public balances: Map<string, number>;
  public validators: Map<string, number>; // 验证者和他们的权益
  public blockTime: number; // 出块时间（毫秒）
  public autoForging: boolean;
  private forgingInterval: NodeJS.Timeout | null;
  public onBlockForged?: (block: Block, validator: string) => void;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.balances = new Map();
    this.validators = new Map();
    this.blockTime = 6000; // 6秒出块时间（类似Cosmos）
    this.autoForging = false;
    this.forgingInterval = null;
  }

  createGenesisBlock(): Block {
    const genesisTransaction = new Transaction('system', 'genesis', 0, 'mint');
    return new Block(0, Date.parse('2024-01-01'), [genesisTransaction], '0');
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // 向后兼容：将挖矿改为验证者锻造
  minePendingTransactions(miningRewardAddress: string): Block | null {
    return this.forgePendingTransactions(miningRewardAddress);
  }

  createTransaction(transaction: Transaction): void {
    // 验证交易
    if (!transaction.isValid()) {
      throw new Error('无法添加无效交易到链上');
    }

    // 检查发送者余额（除了铸造和奖励交易）
    if (transaction.from && transaction.from !== 'system' && transaction.type === 'transfer') {
      const balance = this.getBalance(transaction.from);
      if (balance < transaction.getTotalCost()) {
        throw new Error('余额不足');
      }
    }

    this.pendingTransactions.push(transaction);
  }

  getBalance(address: string): number {
    if (this.balances.has(address)) {
      return this.balances.get(address)!;
    }

    let balance = 0;

    // 计算已确认交易的余额
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= transaction.amount;
        }
        if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }

    this.balances.set(address, balance);
    return balance;
  }

  updateBalances(block: Block): void {
    for (const transaction of block.transactions) {
      if (transaction.from && transaction.from !== 'system') {
        const currentBalance = this.balances.get(transaction.from) || 0;
        this.balances.set(transaction.from, currentBalance - transaction.amount);
      }
      if (transaction.to && transaction.to !== 'burn') {
        const currentBalance = this.balances.get(transaction.to) || 0;
        this.balances.set(transaction.to, currentBalance + transaction.amount);
      }
    }
  }

  getAllTransactions(): Transaction[] {
    const transactions: Transaction[] = [];
    for (const block of this.chain) {
      transactions.push(...block.transactions);
    }
    return transactions;
  }

  isChainValid(): boolean {
    try {
      for (let i = 1; i < this.chain.length; i++) {
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];

        // 检查区块结构
        if (!currentBlock.isValidStructure()) {
          console.log(`区块 ${i} 结构无效`);
          return false;
        }

        // 检查交易有效性
        if (!currentBlock.hasValidTransactions()) {
          console.log(`区块 ${i} 包含无效交易`);
          return false;
        }

        // 检查区块哈希
        if (currentBlock.hash !== currentBlock.calculateHash()) {
          console.log(`区块 ${i} 哈希无效`);
          return false;
        }

        // 检查前一个区块的连接
        if (currentBlock.previousHash !== previousBlock.hash) {
          console.log(`区块 ${i} 与前一个区块连接断开`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('区块链验证过程中出错:', error);
      return false;
    }
  }

  getBlockchainInfo(): BlockchainInfo {
    let isValid = true;
    try {
      isValid = this.isChainValid();
    } catch (error) {
      console.warn('区块链验证失败，但继续运行:', error);
      isValid = false;
    }
    
    const totalSupply = Array.from(this.balances.values()).reduce((a, b) => a + b, 0);
    const lastBlock = this.getLatestBlock();
    
    return {
      height: this.chain.length,
      difficulty: this.difficulty,
      totalSupply,
      pendingTransactions: this.pendingTransactions.length,
      isValid,
      lastBlockHash: lastBlock.hash,
      networkHashRate: this.calculateNetworkHashRate()
    };
  }

  private calculateNetworkHashRate(): number {
    // 简单的网络算力估算
    if (this.chain.length < 2) return 0;
    
    const recentBlocks = this.chain.slice(-10); // 最近10个区块
    let totalTime = 0;
    
    for (let i = 1; i < recentBlocks.length; i++) {
      totalTime += recentBlocks[i].timestamp - recentBlocks[i - 1].timestamp;
    }
    
    const avgBlockTime = totalTime / (recentBlocks.length - 1);
    return avgBlockTime > 0 ? Math.round(1000 / avgBlockTime * 60) : 0; // 每分钟区块数
  }

  getBlock(index: number): Block | null {
    if (index >= 0 && index < this.chain.length) {
      return this.chain[index];
    }
    return null;
  }

  mintTokens(to: string, amount: number): Transaction {
    const mintTransaction = Transaction.createMintTransaction(to, amount);
    this.createTransaction(mintTransaction);
    return mintTransaction;
  }

  // PoS 验证者管理
  addValidator(address: string, stake: number): void {
    if (stake >= 1000) { // 最少1000代币才能成为验证者
      this.validators.set(address, stake);
      console.log(`验证者已添加: ${address} 权益: ${stake}`);
    } else {
      console.log(`权益不足: ${address} 需要至少1000代币`);
    }
  }

  removeValidator(address: string): void {
    this.validators.delete(address);
    console.log(`验证者已移除: ${address}`);
  }

  updateValidatorStake(address: string, newStake: number): void {
    if (this.validators.has(address)) {
      if (newStake >= 1000) {
        this.validators.set(address, newStake);
      } else {
        this.removeValidator(address);
      }
    }
  }

  // 基于权益随机选择验证者
  selectValidator(): string | null {
    if (this.validators.size === 0) {
      // 如果没有验证者，自动将有足够余额的地址设为验证者
      for (const [address, balance] of this.balances.entries()) {
        if (balance >= 1000) {
          this.addValidator(address, balance);
        }
      }
    }

    if (this.validators.size === 0) {
      return null;
    }

    // 计算总权益
    let totalStake = 0;
    for (const stake of this.validators.values()) {
      totalStake += stake;
    }

    // 权益加权随机选择
    let random = Math.random() * totalStake;
    for (const [address, stake] of this.validators.entries()) {
      random -= stake;
      if (random <= 0) {
        return address;
      }
    }

    // 回退：返回第一个验证者
    return this.validators.keys().next().value || null;
  }

  // PoS 区块锻造
  forgePendingTransactions(validatorAddress: string | null = null): Block | null {
    const selectedValidator = validatorAddress || this.selectValidator();
    
    if (!selectedValidator) {
      console.log('没有可用的验证者进行区块锻造');
      return null;
    }

    // 添加挖矿奖励交易
    const rewardTransaction = Transaction.createMintTransaction(
      selectedValidator, 
      this.miningReward
    );
    this.pendingTransactions.push(rewardTransaction);

    const block = new Block(
      this.chain.length,
      Date.now(),
      [...this.pendingTransactions], // 创建副本
      this.getLatestBlock().hash,
      selectedValidator
    );

    block.forgeBlock();

    console.log(`区块已被验证者锻造: ${selectedValidator}`);
    this.chain.push(block);

    // 更新余额
    this.updateBalances(block);
    
    // 更新验证者权益
    this.updateValidatorStake(selectedValidator, this.getBalance(selectedValidator));

    this.pendingTransactions = [];
    
    // 触发事件回调（如果有的话）
    if (this.onBlockForged) {
      this.onBlockForged(block, selectedValidator);
    }
    
    return block;
  }

  // 启动自动出块
  startAutoForging(): void {
    if (this.autoForging) return;
    
    this.autoForging = true;
    console.log('自动锻造已启动，间隔时间:', this.blockTime / 1000, '秒');
    
    this.forgingInterval = setInterval(() => {
      if (this.pendingTransactions.length > 0) {
        this.forgePendingTransactions();
      }
    }, this.blockTime);
  }

  // 停止自动出块
  stopAutoForging(): void {
    if (!this.autoForging) return;
    
    this.autoForging = false;
    if (this.forgingInterval) {
      clearInterval(this.forgingInterval);
      this.forgingInterval = null;
    }
    console.log('自动锻造已停止');
  }

  // 获取验证者信息
  getValidators(): Map<string, number> {
    return new Map(this.validators);
  }

  // 获取网络统计信息
  getNetworkStats(): object {
    return {
      totalBlocks: this.chain.length,
      totalTransactions: this.getAllTransactions().length,
      pendingTransactions: this.pendingTransactions.length,
      validators: this.validators.size,
      totalSupply: Array.from(this.balances.values()).reduce((a, b) => a + b, 0),
      averageBlockTime: this.calculateAverageBlockTime(),
      difficulty: this.difficulty,
      isAutoForging: this.autoForging
    };
  }

  private calculateAverageBlockTime(): number {
    if (this.chain.length < 2) return 0;
    
    const recentBlocks = this.chain.slice(-10);
    let totalTime = 0;
    
    for (let i = 1; i < recentBlocks.length; i++) {
      totalTime += recentBlocks[i].timestamp - recentBlocks[i - 1].timestamp;
    }
    
    return Math.round(totalTime / (recentBlocks.length - 1));
  }

  // 重置区块链（用于测试）
  reset(): void {
    this.stopAutoForging();
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.balances.clear();
    this.validators.clear();
    console.log('区块链已重置');
  }
}