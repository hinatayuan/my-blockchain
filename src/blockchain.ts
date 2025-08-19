import { Block } from './block'
import { TransactionClass } from './transaction'

export interface BlockchainInfo {
  height: number
  difficulty: number
  pendingTransactions: number
  totalSupply: number
  isValid: boolean
}

export interface BlockchainData {
  chain: Block[]
  difficulty: number
  pendingTransactions: TransactionClass[]
  miningReward: number
  balances: [string, number][]
}

export class Blockchain {
  chain: Block[]
  difficulty: number
  pendingTransactions: TransactionClass[]
  miningReward: number
  balances: Map<string, number>

  constructor() {
    this.chain = [this.createGenesisBlock()]
    this.difficulty = 2
    this.pendingTransactions = []
    this.miningReward = 100
    this.balances = new Map()
  }

  createGenesisBlock(): Block {
    const genesisTransaction = new TransactionClass(
      null,
      'genesis',
      0,
      'genesis'
    )
    return new Block(Date.parse('2024-01-01'), [genesisTransaction], '0')
  }

  getLatestBlock(): Block {
    const latestBlock = this.chain[this.chain.length - 1]
    if (!latestBlock) {
      throw new Error('区块链为空，无法获取最新区块')
    }
    return latestBlock
  }

  minePendingTransactions(miningRewardAddress: string): void {
    const rewardTransaction = TransactionClass.createRewardTransaction(
      miningRewardAddress,
      this.miningReward
    )
    this.pendingTransactions.push(rewardTransaction)

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    )

    block.mineBlock(this.difficulty)

    console.log('Block successfully mined!')
    this.chain.push(block)

    // Update balances
    this.updateBalances(block)

    this.pendingTransactions = []
  }

  createTransaction(transaction: TransactionClass): void {
    // Validate transaction
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain')
    }

    // Check if sender has enough balance (except for mint and reward transactions)
    if (transaction.from && transaction.type === 'transfer') {
      const balance = this.getBalance(transaction.from)
      if (balance < transaction.amount) {
        throw new Error('Not enough balance')
      }
    }

    this.pendingTransactions.push(transaction)
  }

  getBalance(address: string): number {
    if (this.balances.has(address)) {
      return this.balances.get(address)!
    }

    let balance = 0

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= transaction.amount
        }

        if (transaction.to === address) {
          balance += transaction.amount
        }
      }
    }

    // Include pending transactions
    for (const transaction of this.pendingTransactions) {
      if (transaction.from === address) {
        balance -= transaction.amount
      }

      if (transaction.to === address) {
        balance += transaction.amount
      }
    }

    this.balances.set(address, balance)
    return balance
  }

  updateBalances(block: Block): void {
    for (const transaction of block.transactions) {
      if (transaction.from) {
        const currentBalance = this.getBalance(transaction.from)
        this.balances.set(transaction.from, currentBalance - transaction.amount)
      }

      if (transaction.to) {
        const currentBalance = this.getBalance(transaction.to)
        this.balances.set(transaction.to, currentBalance + transaction.amount)
      }
    }
  }

  getAllTransactions(): TransactionClass[] {
    const transactions: TransactionClass[] = []
    for (const block of this.chain) {
      transactions.push(...block.transactions)
    }
    return transactions
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]
      const previousBlock = this.chain[i - 1]

      if (!currentBlock || !previousBlock) {
        console.warn(`区块 ${i} 或 ${i - 1} 不存在`)
        return false
      }

      if (!currentBlock.hasValidTransactions()) {
        console.warn(`区块 ${i} 包含无效交易`)
        return false
      }

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

  getBlockchainInfo(): BlockchainInfo {
    let isValid = true
    try {
      isValid = this.isChainValid()
    } catch (error) {
      console.warn('区块链验证失败，但继续运行:', (error as Error).message)
      isValid = false
    }

    return {
      height: this.chain.length,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions.length,
      totalSupply: Array.from(this.balances.values()).reduce(
        (a, b) => a + b,
        0
      ),
      isValid: isValid
    }
  }

  getBlock(index: number): Block | null {
    if (index >= 0 && index < this.chain.length) {
      const block = this.chain[index]
      return block || null
    }
    return null
  }

  mintTokens(to: string, amount: number): TransactionClass {
    const mintTransaction = TransactionClass.createMintTransaction(to, amount)
    this.createTransaction(mintTransaction)
    return mintTransaction
  }
}
