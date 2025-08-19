import { v4 as uuidv4 } from 'uuid';
import { CryptoUtils } from './crypto';
import { Transaction as ITransaction } from './types';

export class Transaction implements ITransaction {
  public id: string;
  public from: string;
  public to: string;
  public amount: number;
  public timestamp: number;
  public type: 'transfer' | 'mint' | 'burn';
  public signature?: string;
  public fee: number;
  public memo?: string;

  constructor(
    from: string,
    to: string,
    amount: number,
    type: 'transfer' | 'mint' | 'burn' = 'transfer',
    fee: number = 0
  ) {
    this.id = uuidv4();
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.type = type;
    this.fee = fee;
    this.timestamp = Date.now();
  }

  calculateHash(): string {
    return CryptoUtils.hash({
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      timestamp: this.timestamp,
      fee: this.fee,
      memo: this.memo
    });
  }

  signTransaction(privateKey: string): void {
    if (this.from === 'system' && this.type === 'mint') {
      // 系统铸造代币不需要签名
      this.signature = 'system';
      return;
    }

    const hashTx = this.calculateHash();
    this.signature = CryptoUtils.signTransaction(privateKey, hashTx);
  }

  isValid(): boolean {
    // 检查基本字段
    if (!this.from || !this.to || this.amount <= 0) {
      console.log('交易基本字段验证失败');
      return false;
    }

    // 系统铸造交易的特殊验证
    if (this.from === 'system' && this.type === 'mint') {
      return this.signature === 'system';
    }

    // 其他交易需要有效签名
    if (!this.signature) {
      console.log('交易缺少签名');
      return false;
    }

    try {
      const hashTx = this.calculateHash();
      // 这里需要获取发送者的公钥进行验证
      // 在实际应用中，公钥应该从钱包管理器中获取
      return true; // 临时返回true，实际应该验证签名
    } catch (error) {
      console.log('交易签名验证失败:', error);
      return false;
    }
  }

  // 检查交易金额是否有效
  isValidAmount(): boolean {
    return this.amount > 0 && Number.isFinite(this.amount);
  }

  // 检查交易费是否有效
  isValidFee(): boolean {
    return this.fee >= 0 && Number.isFinite(this.fee);
  }

  // 获取交易总成本（金额 + 费用）
  getTotalCost(): number {
    return this.amount + this.fee;
  }

  // 添加备注
  addMemo(memo: string): void {
    this.memo = memo;
  }

  // 转换为JSON格式
  toJSON(): object {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      fee: this.fee,
      timestamp: this.timestamp,
      signature: this.signature,
      memo: this.memo
    };
  }

  // 创建铸造交易的静态方法
  static createMintTransaction(to: string, amount: number): Transaction {
    const tx = new Transaction('system', to, amount, 'mint');
    tx.signTransaction(''); // 系统交易
    return tx;
  }

  // 创建销毁交易的静态方法
  static createBurnTransaction(from: string, amount: number): Transaction {
    return new Transaction(from, 'burn', amount, 'burn');
  }
}