import { CryptoUtils, KeyPair } from './crypto';
import { Wallet as IWallet } from './types';
import { v4 as uuidv4 } from 'uuid';

export class Wallet implements IWallet {
  public id: string;
  public name: string;
  public address: string;
  public publicKey: string;
  public privateKey: string;
  public balance: number;
  public mnemonic?: string;
  public createdAt: number;

  constructor(name: string = '默认钱包') {
    this.id = uuidv4();
    this.name = name;
    this.balance = 0;
    this.createdAt = Date.now();
    
    const keyPair = CryptoUtils.generateKeyPair();
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
    this.address = CryptoUtils.generateAddress(this.publicKey);
  }

  // 从私钥创建钱包
  static fromPrivateKey(privateKey: string, name: string = '导入钱包'): Wallet {
    const wallet = new Wallet(name);
    wallet.privateKey = privateKey;
    // 这里应该从私钥生成公钥，但crypto模块的限制，我们简化处理
    wallet.address = CryptoUtils.generateAddress(privateKey);
    return wallet;
  }

  // 从助记词创建钱包
  static fromMnemonic(mnemonic: string, name: string = '助记词钱包'): Wallet {
    const wallet = new Wallet(name);
    wallet.mnemonic = mnemonic;
    // 这里应该从助记词派生私钥，简化处理
    wallet.address = CryptoUtils.generateAddress(mnemonic);
    return wallet;
  }

  // 更新余额
  updateBalance(newBalance: number): void {
    this.balance = newBalance;
  }

  // 获取钱包信息（不包含私钥）
  getPublicInfo(): Partial<IWallet> {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      publicKey: this.publicKey,
      balance: this.balance
    };
  }

  // 签名交易
  signTransaction(data: any): string {
    return CryptoUtils.signTransaction(this.privateKey, data);
  }

  // 验证签名
  verifySignature(data: any, signature: string): boolean {
    return CryptoUtils.verifySignature(this.publicKey, data, signature);
  }

  // 导出钱包信息（包含私钥，需要密码保护）
  exportWallet(): object {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      mnemonic: this.mnemonic,
      createdAt: this.createdAt
    };
  }

  // 生成新地址（在实际应用中，一个钱包可以有多个地址）
  generateNewAddress(): string {
    const newKeyPair = CryptoUtils.generateKeyPair();
    return CryptoUtils.generateAddress(newKeyPair.publicKey);
  }

  // 更新钱包名称
  updateName(newName: string): void {
    this.name = newName;
  }

  // 检查钱包是否有效
  isValid(): boolean {
    return (
      this.id &&
      this.address &&
      this.publicKey &&
      this.privateKey &&
      this.address === CryptoUtils.generateAddress(this.publicKey)
    );
  }

  // 获取钱包创建时间的可读格式
  getCreatedAtString(): string {
    return new Date(this.createdAt).toLocaleString('zh-CN');
  }

  // 转换为JSON格式
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      balance: this.balance,
      createdAt: this.createdAt
    };
  }
}