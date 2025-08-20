import { CryptoUtils, KeyPair } from './crypto'
import { TransactionClass } from './transaction'
import { Blockchain } from './blockchain'

export interface WalletInfo {
  address: string
  publicKey: string
}

export interface WalletPrivateInfo extends WalletInfo {
  privateKey: string
}

export interface WalletWithName extends WalletInfo {
  name: string
}

export interface WalletBalance {
  address: string
  balance: number
}

export class Wallet {
  privateKey: string
  publicKey: string
  address: string

  constructor() {
    const keyPair: KeyPair = CryptoUtils.generateKeyPair()
    this.privateKey = keyPair.privateKey
    this.publicKey = keyPair.publicKey
    this.address = CryptoUtils.generateAddress(this.publicKey)
  }

  static fromKeys(privateKey: string, publicKey: string): Wallet {
    // 验证密钥格式
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format')
    }
    if (!CryptoUtils.isValidPublicKey(publicKey)) {
      throw new Error('Invalid public key format')
    }

    const wallet = Object.create(Wallet.prototype)
    wallet.privateKey = privateKey
    wallet.publicKey = publicKey
    wallet.address = CryptoUtils.generateAddress(publicKey)
    return wallet
  }

  /**
   * 从私钥创建钱包（自动生成对应公钥）
   * @param privateKey 十六进制私钥
   * @returns Wallet实例
   */
  static fromPrivateKey(privateKey: string): Wallet {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format')
    }

    const wallet = Object.create(Wallet.prototype)
    wallet.privateKey = privateKey
    
    // 从私钥生成公钥
    const publicKeyBytes = require('@noble/secp256k1').getPublicKey(privateKey, true)
    wallet.publicKey = Buffer.from(publicKeyBytes).toString('hex')
    
    wallet.address = CryptoUtils.generateAddress(wallet.publicKey)
    return wallet
  }

  getBalance(blockchain: Blockchain): number {
    return blockchain.getBalance(this.address)
  }

  sendMoney(
    amount: number,
    payeeAddress: string,
    blockchain: Blockchain
  ): TransactionClass {
    if (this.getBalance(blockchain) < amount) {
      throw new Error('Not enough balance')
    }

    const transaction = new TransactionClass(
      this.address,
      payeeAddress,
      amount,
      'transfer'
    )
    transaction.signTransaction(this.privateKey)

    blockchain.createTransaction(transaction)
    return transaction
  }

  getPublicInfo(): WalletInfo {
    return {
      address: this.address,
      publicKey: this.publicKey
    }
  }

  getPrivateInfo(): WalletPrivateInfo {
    return {
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey
    }
  }
}

export class WalletManager {
  wallets: Map<string, Wallet>

  constructor() {
    this.wallets = new Map()
  }

  createWallet(name: string): Wallet {
    if (this.wallets.has(name)) {
      throw new Error('Wallet with this name already exists')
    }

    const wallet = new Wallet()
    this.wallets.set(name, wallet)
    return wallet
  }

  importWallet(name: string, privateKey: string, publicKey?: string): Wallet {
    if (this.wallets.has(name)) {
      throw new Error('Wallet with this name already exists')
    }

    let wallet: Wallet
    if (publicKey) {
      // 使用提供的公私钥对
      wallet = Wallet.fromKeys(privateKey, publicKey)
    } else {
      // 仅从私钥导入，自动生成公钥
      wallet = Wallet.fromPrivateKey(privateKey)
    }
    
    this.wallets.set(name, wallet)
    return wallet
  }

  /**
   * 检测并迁移旧格式钱包数据
   * @param walletData 钱包数据（可能是RSA或椭圆曲线格式）
   * @returns 是否为旧格式数据
   */
  private isLegacyWalletData(walletData: any): boolean {
    // 检查是否为RSA格式（PEM格式，包含BEGIN/END标记）
    return typeof walletData.privateKey === 'string' && 
           walletData.privateKey.includes('-----BEGIN PRIVATE KEY-----')
  }

  /**
   * 加载钱包数据（支持新旧格式）
   * @param walletsData 钱包数据数组
   */
  loadWallets(walletsData: any[]): void {
    for (const walletData of walletsData) {
      if (this.isLegacyWalletData(walletData)) {
        console.warn(`Skipping legacy RSA wallet: ${walletData.name}. Please recreate with new format.`)
        continue
      }

      try {
        const wallet = Wallet.fromKeys(walletData.privateKey, walletData.publicKey)
        this.wallets.set(walletData.name, wallet)
        console.log(`Loaded wallet: ${walletData.name}`)
      } catch (error) {
        console.error(`Failed to load wallet ${walletData.name}:`, error)
      }
    }
  }

  getWallet(name: string): Wallet | undefined {
    return this.wallets.get(name)
  }

  getAllWallets(): WalletWithName[] {
    const walletList: WalletWithName[] = []
    for (const [name, wallet] of this.wallets) {
      walletList.push({
        name,
        ...wallet.getPublicInfo()
      })
    }
    return walletList
  }

  deleteWallet(name: string): boolean {
    return this.wallets.delete(name)
  }

  getWalletBalances(blockchain: Blockchain): Record<string, WalletBalance> {
    const balances: Record<string, WalletBalance> = {}
    for (const [name, wallet] of this.wallets) {
      balances[name] = {
        address: wallet.address,
        balance: wallet.getBalance(blockchain)
      }
    }
    return balances
  }
}
