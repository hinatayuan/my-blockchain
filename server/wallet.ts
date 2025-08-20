// 导入加密工具、交易类和区块链类
import { CryptoUtils, KeyPair } from './crypto'
import { TransactionClass } from './transaction'
import { Blockchain } from './blockchain'

// 钱包公开信息接口
export interface WalletInfo {
  address: string // 钱包地址
  publicKey: string // 公钥
}

// 钱包私有信息接口（包含私钥）
export interface WalletPrivateInfo extends WalletInfo {
  privateKey: string // 私钥
}

// 带名称的钱包信息接口
export interface WalletWithName extends WalletInfo {
  name: string // 钱包名称
}

// 钱包余额信息接口
export interface WalletBalance {
  address: string // 钱包地址
  balance: number // 余额
}

/**
 * 钱包类，代表区块链中的一个账户
 * 存储密钥对和地址，提供转账功能
 */
export class Wallet {
  privateKey: string // 私钥，用于签名交易
  publicKey: string // 公钥，用于验证签名
  address: string // 钱包地址，由公钥生成

  /**
   * 创建新钱包，自动生成密钥对和地址
   */
  constructor() {
    // 生成新的密钥对
    const keyPair: KeyPair = CryptoUtils.generateKeyPair()
    this.privateKey = keyPair.privateKey
    this.publicKey = keyPair.publicKey
    // 从公钥生成钱包地址
    this.address = CryptoUtils.generateAddress(this.publicKey)
  }

  /**
   * 从现有密钥对创建钱包（静态方法）
   * @param privateKey 私钥（十六进制格式）
   * @param publicKey 公钥（十六进制格式）
   * @returns 钱包实例
   * @throws 如果密钥格式不正确则抛出错误
   */
  static fromKeys(privateKey: string, publicKey: string): Wallet {
    // 验证密钥格式的正确性
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format')
    }
    if (!CryptoUtils.isValidPublicKey(publicKey)) {
      throw new Error('Invalid public key format')
    }

    // 创建钱包实例并设置属性
    const wallet = Object.create(Wallet.prototype)
    wallet.privateKey = privateKey
    wallet.publicKey = publicKey
    wallet.address = CryptoUtils.generateAddress(publicKey)
    return wallet
  }

  /**
   * 从私钥创建钱包（自动生成对应公钥）
   * 适用于导入现有私钥的情况
   * @param privateKey 十六进制私钥
   * @returns 钱包实例
   * @throws 如果私钥格式不正确则抛出错误
   */
  static fromPrivateKey(privateKey: string): Wallet {
    // 验证私钥格式
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format')
    }

    const wallet = Object.create(Wallet.prototype)
    wallet.privateKey = privateKey
    
    // 从私钥自动生成对应的公钥
    const publicKeyBytes = require('@noble/secp256k1').getPublicKey(privateKey, true)
    wallet.publicKey = Buffer.from(publicKeyBytes).toString('hex')
    
    // 从公钥生成钱包地址
    wallet.address = CryptoUtils.generateAddress(wallet.publicKey)
    return wallet
  }

  /**
   * 获取钱包在区块链中的余额
   * @param blockchain 区块链实例
   * @returns 钱包余额
   */
  getBalance(blockchain: Blockchain): number {
    return blockchain.getBalance(this.address)
  }

  /**
   * 发送代币给指定地址
   * @param amount 要发送的代币数量
   * @param payeeAddress 接收者地址
   * @param blockchain 区块链实例
   * @returns 创建的交易对象
   * @throws 如果余额不足则抛出错误
   */
  sendMoney(
    amount: number,
    payeeAddress: string,
    blockchain: Blockchain
  ): TransactionClass {
    // 检查余额是否足够
    if (this.getBalance(blockchain) < amount) {
      throw new Error('Not enough balance')
    }

    // 创建转账交易
    const transaction = new TransactionClass(
      this.address, // 发送者
      payeeAddress, // 接收者
      amount, // 金额
      'transfer' // 交易类型
    )
    // 使用私钥签名交易
    transaction.signTransaction(this.privateKey)

    // 将交易添加到区块链的待处理队列
    blockchain.createTransaction(transaction)
    return transaction
  }

  /**
   * 获取钱包的公开信息（不包含私钥）
   * @returns 包含地址和公钥的信息对象
   */
  getPublicInfo(): WalletInfo {
    return {
      address: this.address,
      publicKey: this.publicKey
    }
  }

  /**
   * 获取钱包的完整信息（包含私钥）
   * 注意：谨慎使用，避免泄露私钥
   * @returns 包含地址、公钥和私钥的信息对象
   */
  getPrivateInfo(): WalletPrivateInfo {
    return {
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey
    }
  }
}

/**
 * 钱包管理器类，管理多个钱包
 * 提供钱包的创建、删除、查询等功能
 */
export class WalletManager {
  wallets: Map<string, Wallet> // 存储钱包的Map（钱包名称 -> 钱包实例）

  /**
   * 初始化钱包管理器
   */
  constructor() {
    this.wallets = new Map()
  }

  /**
   * 创建新钱包
   * @param name 钱包名称（必须唯一）
   * @returns 新创建的钱包实例
   * @throws 如果钱包名称已存在则抛出错误
   */
  createWallet(name: string): Wallet {
    if (this.wallets.has(name)) {
      throw new Error('Wallet with this name already exists')
    }

    const wallet = new Wallet()
    this.wallets.set(name, wallet)
    return wallet
  }

  /**
   * 导入现有钱包
   * @param name 钱包名称（必须唯一）
   * @param privateKey 私钥
   * @param publicKey 公钥（可选，如果不提供则从私钥自动生成）
   * @returns 导入的钱包实例
   * @throws 如果钱包名称已存在或密钥无效则抛出错误
   */
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
   * 用于向后兼容RSA格式的旧钱包数据
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
   * 从文件或数据库中恢复钱包数据
   * @param walletsData 钱包数据数组
   */
  loadWallets(walletsData: any[]): void {
    for (const walletData of walletsData) {
      // 检查是否为旧格式RSA钱包数据
      if (this.isLegacyWalletData(walletData)) {
        console.warn(`Skipping legacy RSA wallet: ${walletData.name}. Please recreate with new format.`)
        continue
      }

      try {
        // 从密钥对重建钱包
        const wallet = Wallet.fromKeys(walletData.privateKey, walletData.publicKey)
        this.wallets.set(walletData.name, wallet)
        console.log(`Loaded wallet: ${walletData.name}`)
      } catch (error) {
        console.error(`Failed to load wallet ${walletData.name}:`, error)
      }
    }
  }

  /**
   * 根据名称获取钱包
   * @param name 钱包名称
   * @returns 钱包实例，如果不存在则返回undefined
   */
  getWallet(name: string): Wallet | undefined {
    return this.wallets.get(name)
  }

  /**
   * 获取所有钱包的公开信息
   * @returns 包含钱包名称、地址和公钥的钱包列表
   */
  getAllWallets(): WalletWithName[] {
    const walletList: WalletWithName[] = []
    // 遍历所有钱包，提取公开信息
    for (const [name, wallet] of this.wallets) {
      walletList.push({
        name,
        ...wallet.getPublicInfo() // 包含地址和公钥
      })
    }
    return walletList
  }

  /**
   * 删除指定的钱包
   * @param name 要删除的钱包名称
   * @returns 是否成功删除
   */
  deleteWallet(name: string): boolean {
    return this.wallets.delete(name)
  }

  /**
   * 获取所有钱包的余额信息
   * @param blockchain 区块链实例，用于查询余额
   * @returns 钱包名称到余额信息的映射
   */
  getWalletBalances(blockchain: Blockchain): Record<string, WalletBalance> {
    const balances: Record<string, WalletBalance> = {}
    // 遍历所有钱包，获取各自的余额
    for (const [name, wallet] of this.wallets) {
      balances[name] = {
        address: wallet.address,
        balance: wallet.getBalance(blockchain) // 查询区块链中的实时余额
      }
    }
    return balances
  }
}
