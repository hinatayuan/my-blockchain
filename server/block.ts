// 导入加密工具和交易类
import { CryptoUtils } from './crypto'
import { TransactionClass } from './transaction'

// 区块数据接口，定义区块的基本结构
export interface BlockData {
  timestamp: number // 区块创建时间戳
  transactions: TransactionClass[] // 区块包含的交易列表
  previousHash: string // 前一个区块的哈希值
  hash: string // 当前区块的哈希值
  nonce: number // 挖矿时的随机数，用于工作量证明
}

/**
 * 区块类，代表区块链中的一个区块
 * 包含交易数据、时间戳、哈希值等信息
 */
export class Block {
  timestamp: number // 区块创建的时间戳
  transactions: TransactionClass[] // 区块包含的交易列表
  previousHash: string // 前一个区块的哈希值，用于链接区块
  nonce: number // 挖矿过程中的随机数，用于工作量证明
  hash: string // 当前区块的哈希值

  /**
   * 创建新区块
   * @param timestamp 区块创建时间
   * @param transactions 区块包含的交易列表
   * @param previousHash 前一个区块的哈希值
   */
  constructor(
    timestamp: number,
    transactions: TransactionClass[],
    previousHash: string = ''
  ) {
    this.timestamp = timestamp
    this.transactions = transactions
    this.previousHash = previousHash
    this.nonce = 0 // 初始化nonce为0
    this.hash = this.calculateHash() // 计算初始哈希值
  }

  /**
   * 计算区块的哈希值
   * 基于区块的所有数据（时间戳、交易、前置哈希、nonce）
   * @returns 区块的SHA256哈希值
   */
  calculateHash(): string {
    return CryptoUtils.hash({
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      nonce: this.nonce // 包含nonce以实现工作量证明
    })
  }

  /**
   * 挖矿区块，实现工作量证明（Proof of Work）
   * 通过不断尝试不同nonce值，直到找到符合难度要求的哈希值
   * @param difficulty 挖矿难度，即哈希值开头零的个数
   */
  mineBlock(difficulty: number): void {
    // 创建目标字符串（全是0）
    const target = Array(difficulty + 1).join('0')

    // 不断尝试不同nonce值，直到哈希值开头的零数量达到难度要求
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++ // 增加nonce
      this.hash = this.calculateHash() // 重新计算哈希值
    }

    console.log(`Block mined: ${this.hash}`)
  }

  /**
   * 检查区块中的所有交易是否有效
   * @returns 区块中的所有交易是否都有效
   */
  hasValidTransactions(): boolean {
    // 遍历区块中的所有交易，检查各交易的有效性
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false // 只要有一个交易无效，整个区块就无效
      }
    }
    return true // 所有交易都有效
  }
}
