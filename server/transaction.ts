// 导入UUID生成器和加密工具
import { v4 as uuidv4 } from 'uuid'
import { CryptoUtils } from './crypto'

// 交易数据接口，定义交易的基本结构
export interface Transaction {
  id: string // 交易唯一标识符
  from: string | null // 发送者地址（null表示系统交易）
  to: string // 接收者地址
  amount: number // 交易金额
  type: 'transfer' | 'mint' | 'reward' | 'genesis' // 交易类型
  timestamp: number // 交易创建时间戳
  signature: string | null // 数字签名（用于验证交易真实性）
  hash?: string // 交易哈希值（可选）
}

// 用于签名的交易数据接口
export interface TransactionDataForSigning {
  id: string // 交易ID
  from: string | null // 发送者地址
  to: string // 接收者地址
  amount: number // 交易金额
  type: string // 交易类型
  timestamp: number // 时间戳
}

/**
 * 交易类，实现区块链中的交易功能
 * 支持转账、铸造、挖矿奖励和创世交易
 */
export class TransactionClass {
  id: string // 交易的唯一标识符
  from: string | null // 发送者地址（null表示系统交易）
  to: string // 接收者地址
  amount: number // 交易金额
  type: 'transfer' | 'mint' | 'reward' | 'genesis' // 交易类型
  timestamp: number // 交易创建时间
  signature: string | null // 数字签名，用于验证交易真实性
  hash: string // 交易的哈希值

  /**
   * 创建新交易
   * @param from 发送者地址（null表示系统交易）
   * @param to 接收者地址
   * @param amount 交易金额
   * @param type 交易类型，默认为'transfer'
   */
  constructor(
    from: string | null,
    to: string,
    amount: number,
    type: 'transfer' | 'mint' | 'reward' | 'genesis' = 'transfer'
  ) {
    this.id = uuidv4() // 生成唯一ID
    this.from = from
    this.to = to
    this.amount = amount
    this.type = type
    this.timestamp = Date.now() // 设置当前时间戳
    this.signature = null // 初始化时暂无签名
    this.hash = this.calculateHash() // 计算交易哈希值
  }

  /**
   * 计算交易的哈希值
   * 基于交易的主要属性进行哈希计算
   * @returns 交易的SHA256哈希值
   */
  calculateHash(): string {
    return CryptoUtils.hash({
      id: this.id,
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      timestamp: this.timestamp
    })
  }

  /**
   * 使用私钥签名交易
   * 通过数字签名证明交易的真实性和授权性
   * @param privateKey 发送者的私钥
   */
  signTransaction(privateKey: string): void {
    // 准备用于签名的交易数据
    const transactionData: TransactionDataForSigning = {
      id: this.id,
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      timestamp: this.timestamp
    }

    // 使用椭圆曲线签名算法签名交易
    this.signature = CryptoUtils.signTransaction(privateKey, transactionData)
    // 签名后重新计算哈希值
    this.hash = this.calculateHash()
  }

  /**
   * 验证交易的有效性
   * 检查交易的基本有效性，包括地址、金额等
   * @returns 交易是否有效
   */
  isValid(): boolean {
    // 创世交易、挖矿奖励和铸造交易不需要签名验证
    if (
      this.from === null ||
      this.type === 'reward' ||
      this.type === 'mint' ||
      this.type === 'genesis'
    ) {
      return true
    }

    // 对于转账交易，检查基本有效性
    if (this.type === 'transfer') {
      // 必须有有效的发送者和接收者地址
      if (!this.from || !this.to) return false
      // 必须有正数金额
      if (this.amount <= 0) return false
      // 为了演示目的，我们对签名验证较为宽松
      // 在生产环境中，这里应该验证签名对应的公钥
      return true
    }

    return true
  }

  /**
   * 创建铸造交易（静态方法）
   * 用于创建新的代币并发送到指定地址
   * @param to 接收新铸造代币的地址
   * @param amount 要铸造的代币数量
   * @returns 铸造交易实例
   */
  static createMintTransaction(to: string, amount: number): TransactionClass {
    return new TransactionClass(null, to, amount, 'mint')
  }

  /**
   * 创建挖矿奖励交易（静态方法）
   * 用于向矿工发放挖矿奖励
   * @param to 矿工地址
   * @param amount 奖励数量
   * @returns 奖励交易实例
   */
  static createRewardTransaction(to: string, amount: number): TransactionClass {
    return new TransactionClass(null, to, amount, 'reward')
  }

  /**
   * 从原始数据重建交易实例（静态方法）
   * 用于从数据库或JSON文件中恢复交易对象
   * @param data 原始交易数据
   * @returns 交易实例
   */
  static fromData(data: Transaction): TransactionClass {
    // 创建新的交易实例
    const tx = new TransactionClass(data.from, data.to, data.amount, data.type)
    // 使用原始数据覆盖默认生成的值
    tx.id = data.id // 使用原始的id
    tx.timestamp = data.timestamp // 使用原始的timestamp
    tx.signature = data.signature // 保持原有签名
    tx.hash = data.hash || tx.calculateHash() // 使用原始哈希或重新计算
    return tx
  }
}
