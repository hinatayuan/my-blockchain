import { CryptoUtils } from './crypto';
import { Transaction } from './transaction';
import { BlockData } from './types';

export class Block implements BlockData {
  public index: number;
  public timestamp: number;
  public data: any;
  public previousHash: string;
  public hash: string;
  public nonce: number;
  public transactions: Transaction[];
  public validator: string | null;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string = '',
    validator: string | null = null
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.data = transactions; // 保持向后兼容
    this.previousHash = previousHash;
    this.validator = validator; // PoS验证者
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return CryptoUtils.hash({
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      validator: this.validator,
      nonce: this.nonce
    });
  }

  // PoS: 锻造区块而不是挖矿
  forgeBlock(): void {
    // 在PoS中，验证者不需要解决计算难题
    // 只需要证明他们拥有足够的权益
    this.hash = this.calculateHash();
    console.log(`验证者 ${this.validator} 锻造了区块: ${this.hash}`);
  }

  // 保留原方法以兼容现有代码
  mineBlock(difficulty: number): void {
    const target = Array(difficulty + 1).join('0');
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    console.log(`区块已挖出: ${this.hash}`);
  }

  hasValidTransactions(): boolean {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        console.log('发现无效交易:', transaction);
        return false;
      }
    }
    return true;
  }

  // 获取区块大小（字节）
  getSize(): number {
    return Buffer.byteLength(JSON.stringify(this), 'utf8');
  }

  // 验证区块结构
  isValidStructure(): boolean {
    return (
      typeof this.index === 'number' &&
      typeof this.timestamp === 'number' &&
      typeof this.previousHash === 'string' &&
      typeof this.hash === 'string' &&
      typeof this.nonce === 'number' &&
      Array.isArray(this.transactions)
    );
  }

  // 转换为JSON格式
  toJSON(): object {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce,
      validator: this.validator
    };
  }
}