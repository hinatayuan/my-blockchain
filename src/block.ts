import { CryptoUtils } from './crypto'
import { TransactionClass } from './transaction'

export interface BlockData {
  timestamp: number
  transactions: TransactionClass[]
  previousHash: string
  hash: string
  nonce: number
}

export class Block {
  timestamp: number
  transactions: TransactionClass[]
  previousHash: string
  nonce: number
  hash: string

  constructor(
    timestamp: number,
    transactions: TransactionClass[],
    previousHash: string = ''
  ) {
    this.timestamp = timestamp
    this.transactions = transactions
    this.previousHash = previousHash
    this.nonce = 0
    this.hash = this.calculateHash()
  }

  calculateHash(): string {
    return CryptoUtils.hash({
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      nonce: this.nonce
    })
  }

  mineBlock(difficulty: number): void {
    const target = Array(difficulty + 1).join('0')

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++
      this.hash = this.calculateHash()
    }

    console.log(`Block mined: ${this.hash}`)
  }

  hasValidTransactions(): boolean {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false
      }
    }
    return true
  }
}
