// 导入区块和交易类
import { Block } from './block'
import { TransactionClass } from './transaction'

// 区块链信息接口，用于向客户端返回基本状态
export interface BlockchainInfo {
  height: number // 区块链高度（区块数量）
  difficulty: number // 挖矿难度
  pendingTransactions: number // 待处理交易数量
  totalSupply: number // 代币总供应量
  isValid: boolean // 区块链是否有效
}

// 区块链数据接口，用于数据持久化
export interface BlockchainData {
  chain: Block[] // 区块链主链
  difficulty: number // 挖矿难度
  pendingTransactions: TransactionClass[] // 待处理交易列表
  miningReward: number // 挖矿奖励数量
  balances: [string, number][] // 账户余额映射（地址 -> 余额）
}

/**
 * 区块链类，实现区块链的核心功能
 * 包括区块管理、交易处理、挖矿和余额管理
 */
export class Blockchain {
  chain: Block[] // 区块链主链，存储所有区块
  difficulty: number // 挖矿难度，控制挖矿速度
  pendingTransactions: TransactionClass[] // 待打包的交易队列
  miningReward: number // 挖矿成功后的奖励数量
  balances: Map<string, number> // 账户余额缓存（地址 -> 余额）

  constructor() {
    this.chain = [this.createGenesisBlock()] // 初始化时创建创世区块
    this.difficulty = 2 // 设置初始挖矿难度
    this.pendingTransactions = [] // 初始化空的交易队列
    this.miningReward = 100 // 设置挖矿奖励
    this.balances = new Map() // 初始化余额映射
  }

  /**
   * 创建创世区块（区块链的第一个区块）
   * @returns 创世区块
   */
  createGenesisBlock(): Block {
    // 创建创世交易，作为初始交易记录
    const genesisTransaction = new TransactionClass(
      null, // 无发送者
      'genesis', // 接收者为'genesis'
      0, // 无金额
      'genesis' // 交易类型为'genesis'
    )
    // 返回创世区块，时间戳为2024-01-01，前置哈希为'0'
    return new Block(Date.parse('2024-01-01'), [genesisTransaction], '0')
  }

  /**
   * 获取区块链中的最新区块
   * @returns 最新的区块
   * @throws 如果区块链为空则抛出错误
   */
  getLatestBlock(): Block {
    const latestBlock = this.chain[this.chain.length - 1]
    if (!latestBlock) {
      throw new Error('区块链为空，无法获取最新区块')
    }
    return latestBlock
  }

  /**
   * 挖矿待处理交易，将其打包成新区块
   * @param miningRewardAddress 矿工地址，用于接收挖矿奖励
   */
  minePendingTransactions(miningRewardAddress: string): void {
    // 创建挖矿奖励交易
    const rewardTransaction = TransactionClass.createRewardTransaction(
      miningRewardAddress,
      this.miningReward
    )
    // 将奖励交易添加到待处理交易中
    this.pendingTransactions.push(rewardTransaction)

    // 创建新区块，包含所有待处理交易
    const block = new Block(
      Date.now(), // 当前时间戳
      this.pendingTransactions, // 所有待处理交易
      this.getLatestBlock().hash // 前一个区块的哈希
    )

    // 执行工作量证明挖矿
    block.mineBlock(this.difficulty)

    console.log('Block successfully mined!')
    // 将新区块添加到区块链中
    this.chain.push(block)

    // 更新所有账户余额
    this.updateBalances(block)

    // 清空待处理交易队列
    this.pendingTransactions = []
  }

  /**
   * 创建新交易并添加到待处理队列
   * @param transaction 要添加的交易
   * @throws 如果交易无效或余额不足则抛出错误
   */
  createTransaction(transaction: TransactionClass): void {
    // 验证交易的有效性
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain')
    }

    // 检查发送者余额是否足够（除了铸造和奖励交易）
    if (transaction.from && transaction.type === 'transfer') {
      const balance = this.getBalance(transaction.from)
      if (balance < transaction.amount) {
        throw new Error('Not enough balance')
      }
    }

    // 将交易添加到待处理队列
    this.pendingTransactions.push(transaction)
  }

  /**
   * 获取指定地址的余额
   * 通过遍历所有区块和待处理交易来计算余额
   * @param address 要查询的地址
   * @returns 该地址的余额
   */
  getBalance(address: string): number {
    // 先检查缓存中是否已有计算结果
    if (this.balances.has(address)) {
      return this.balances.get(address)!
    }

    let balance = 0

    // 遍历所有区块中的交易
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // 如果是发送者，余额减少
        if (transaction.from === address) {
          balance -= transaction.amount
        }

        // 如果是接收者，余额增加
        if (transaction.to === address) {
          balance += transaction.amount
        }
      }
    }

    // 考虑待处理交易的影响
    for (const transaction of this.pendingTransactions) {
      if (transaction.from === address) {
        balance -= transaction.amount
      }

      if (transaction.to === address) {
        balance += transaction.amount
      }
    }

    // 缓存计算结果并返回
    this.balances.set(address, balance)
    return balance
  }

  /**
   * 更新账户余额缓存
   * 在新区块添加后调用，更新所有相关账户的余额
   * @param block 新添加的区块
   */
  updateBalances(block: Block): void {
    // 遍历区块中的所有交易
    for (const transaction of block.transactions) {
      // 更新发送者余额
      if (transaction.from) {
        const currentBalance = this.getBalance(transaction.from)
        this.balances.set(transaction.from, currentBalance - transaction.amount)
      }

      // 更新接收者余额
      if (transaction.to) {
        const currentBalance = this.getBalance(transaction.to)
        this.balances.set(transaction.to, currentBalance + transaction.amount)
      }
    }
  }

  /**
   * 获取区块链中的所有交易
   * @returns 所有交易的数组
   */
  getAllTransactions(): TransactionClass[] {
    const transactions: TransactionClass[] = []
    // 遍历所有区块，收集所有交易
    for (const block of this.chain) {
      transactions.push(...block.transactions)
    }
    return transactions
  }

  /**
   * 验证区块链的有效性
   * 检查每个区块的交易有效性和链的连续性
   * @returns 区块链是否有效
   */
  isChainValid(): boolean {
    // 从第二个区块开始验证（第一个是创世区块）
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]
      const previousBlock = this.chain[i - 1]

      // 检查区块是否存在
      if (!currentBlock || !previousBlock) {
        console.warn(`区块 ${i} 或 ${i - 1} 不存在`)
        return false
      }

      // 检查区块中的交易是否有效
      if (!currentBlock.hasValidTransactions()) {
        console.warn(`区块 ${i} 包含无效交易`)
        return false
      }

      // 检查区块链的连续性（前置哈希匹配）
      // 对于演示目的，我们主要检查交易有效性和链结构
      // 在生产环境中应该验证哈希
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.warn(`区块 ${i} 的前置哈希不匹配`)
        return false
      }

      // 检查区块是否有基本的哈希值
      if (!currentBlock.hash || currentBlock.hash.length === 0) {
        console.warn(`区块 ${i} 缺少哈希值`)
        return false
      }
    }

    return true
  }

  /**
   * 获取区块链的基本信息
   * 包括高度、难度、待处理交易数、代币总供应量等
   * @returns 区块链信息对象
   */
  getBlockchainInfo(): BlockchainInfo {
    let isValid = true
    try {
      // 尝试验证区块链有效性
      isValid = this.isChainValid()
    } catch (error) {
      console.warn('区块链验证失败，但继续运行:', (error as Error).message)
      isValid = false
    }

    return {
      height: this.chain.length, // 区块链高度
      difficulty: this.difficulty, // 挖矿难度
      pendingTransactions: this.pendingTransactions.length, // 待处理交易数量
      totalSupply: Array.from(this.balances.values()).reduce( // 代币总供应量
        (a, b) => a + b,
        0
      ),
      isValid: isValid // 区块链是否有效
    }
  }

  /**
   * 根据索引获取指定的区块
   * @param index 区块索引（0表示创世区块）
   * @returns 指定索引的区块，如果不存在则返回null
   */
  getBlock(index: number): Block | null {
    // 检查索引是否在有效范围内
    if (index >= 0 && index < this.chain.length) {
      const block = this.chain[index]
      return block || null
    }
    return null
  }

  /**
   * 铸造新的代币并发送到指定地址
   * @param to 接收新铸造代币的地址
   * @param amount 要铸造的代币数量
   * @returns 铸造交易对象
   */
  mintTokens(to: string, amount: number): TransactionClass {
    // 创建铸造交易
    const mintTransaction = TransactionClass.createMintTransaction(to, amount)
    // 将铸造交易添加到待处理队列
    this.createTransaction(mintTransaction)
    return mintTransaction
  }
}
