import { Transaction } from '../transaction';
import { Block } from '../block';

export class ValidationUtils {
  // 验证地址格式
  static isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // 检查长度和字符
    return /^[a-fA-F0-9]{40}$/.test(address);
  }

  // 验证金额
  static isValidAmount(amount: number): boolean {
    return (
      typeof amount === 'number' &&
      amount > 0 &&
      Number.isFinite(amount) &&
      amount <= Number.MAX_SAFE_INTEGER
    );
  }

  // 验证交易类型
  static isValidTransactionType(type: string): boolean {
    return ['transfer', 'mint', 'burn'].includes(type);
  }

  // 验证时间戳
  static isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneHourLater = now + (60 * 60 * 1000);
    
    return (
      typeof timestamp === 'number' &&
      timestamp >= oneHourAgo &&
      timestamp <= oneHourLater
    );
  }

  // 验证哈希格式
  static isValidHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  }

  // 验证区块索引
  static isValidBlockIndex(index: number, expectedIndex: number): boolean {
    return (
      typeof index === 'number' &&
      index === expectedIndex &&
      index >= 0
    );
  }

  // 验证交易费用
  static isValidFee(fee: number): boolean {
    return (
      typeof fee === 'number' &&
      fee >= 0 &&
      Number.isFinite(fee)
    );
  }

  // 验证签名格式
  static isValidSignature(signature: string): boolean {
    if (!signature || typeof signature !== 'string') {
      return false;
    }
    
    // 系统交易的特殊签名
    if (signature === 'system') {
      return true;
    }
    
    // 普通签名应该是十六进制字符串
    return /^[a-fA-F0-9]+$/.test(signature) && signature.length > 0;
  }

  // 验证钱包名称
  static isValidWalletName(name: string): boolean {
    return (
      typeof name === 'string' &&
      name.length > 0 &&
      name.length <= 50 &&
      /^[\u4e00-\u9fa5a-zA-Z0-9\s_-]+$/.test(name) // 支持中文、英文、数字、空格、下划线、连字符
    );
  }

  // 验证区块难度
  static isValidDifficulty(difficulty: number): boolean {
    return (
      typeof difficulty === 'number' &&
      difficulty >= 0 &&
      difficulty <= 10 &&
      Number.isInteger(difficulty)
    );
  }

  // 检查余额是否足够
  static hasSufficientBalance(balance: number, amount: number, fee: number = 0): boolean {
    return balance >= (amount + fee);
  }

  // 验证权益数量（用于PoS）
  static isValidStake(stake: number): boolean {
    return (
      typeof stake === 'number' &&
      stake >= 0 &&
      Number.isFinite(stake)
    );
  }

  // 验证区块时间间隔
  static isValidBlockTimeInterval(currentTime: number, previousTime: number, maxInterval: number = 300000): boolean {
    const interval = currentTime - previousTime;
    return interval > 0 && interval <= maxInterval; // 最大5分钟间隔
  }

  // 批量验证交易
  static validateTransactions(transactions: Transaction[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      
      if (!tx.isValid()) {
        errors.push(`交易 ${i} 无效`);
      }
      
      if (!this.isValidAmount(tx.amount)) {
        errors.push(`交易 ${i} 金额无效`);
      }
      
      if (!this.isValidAddress(tx.from) && tx.from !== 'system') {
        errors.push(`交易 ${i} 发送地址无效`);
      }
      
      if (!this.isValidAddress(tx.to) && tx.to !== 'burn') {
        errors.push(`交易 ${i} 接收地址无效`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 验证区块
  static validateBlock(block: Block, previousBlock?: Block): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 基本结构验证
    if (!block.isValidStructure()) {
      errors.push('区块结构无效');
    }
    
    // 验证时间戳
    if (!this.isValidTimestamp(block.timestamp)) {
      errors.push('区块时间戳无效');
    }
    
    // 验证哈希
    if (!this.isValidHash(block.hash)) {
      errors.push('区块哈希格式无效');
    }
    
    // 验证与前一个区块的连接
    if (previousBlock) {
      if (block.previousHash !== previousBlock.hash) {
        errors.push('区块与前一个区块连接断开');
      }
      
      if (block.index !== previousBlock.index + 1) {
        errors.push('区块索引不连续');
      }
      
      if (!this.isValidBlockTimeInterval(block.timestamp, previousBlock.timestamp)) {
        errors.push('区块时间间隔无效');
      }
    }
    
    // 验证交易
    const txValidation = this.validateTransactions(block.transactions);
    if (!txValidation.valid) {
      errors.push(...txValidation.errors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}