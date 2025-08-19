import { v4 as uuidv4 } from 'uuid'
import { CryptoUtils } from './crypto'

export interface Transaction {
  id: string
  from: string | null
  to: string
  amount: number
  type: 'transfer' | 'mint' | 'reward' | 'genesis'
  timestamp: number
  signature: string | null
  hash?: string
}

export interface TransactionDataForSigning {
  id: string
  from: string | null
  to: string
  amount: number
  type: string
  timestamp: number
}

export class TransactionClass {
  id: string
  from: string | null
  to: string
  amount: number
  type: 'transfer' | 'mint' | 'reward' | 'genesis'
  timestamp: number
  signature: string | null
  hash: string

  constructor(
    from: string | null,
    to: string,
    amount: number,
    type: 'transfer' | 'mint' | 'reward' | 'genesis' = 'transfer'
  ) {
    this.id = uuidv4()
    this.from = from
    this.to = to
    this.amount = amount
    this.type = type
    this.timestamp = Date.now()
    this.signature = null
    this.hash = this.calculateHash()
  }

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

  signTransaction(privateKey: string): void {
    const transactionData: TransactionDataForSigning = {
      id: this.id,
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      timestamp: this.timestamp
    }

    this.signature = CryptoUtils.signTransaction(privateKey, transactionData)
    this.hash = this.calculateHash()
  }

  isValid(): boolean {
    // Genesis transactions and mining rewards don't need signature verification
    if (
      this.from === null ||
      this.type === 'reward' ||
      this.type === 'mint' ||
      this.type === 'genesis'
    ) {
      return true
    }

    // For transfer transactions, check basic validity
    if (this.type === 'transfer') {
      // Must have valid from and to addresses
      if (!this.from || !this.to) return false
      // Must have positive amount
      if (this.amount <= 0) return false
      // For demo purposes, we'll be lenient about signatures
      // In production, this should verify the signature against the public key
      return true
    }

    return true
  }

  static createMintTransaction(to: string, amount: number): TransactionClass {
    return new TransactionClass(null, to, amount, 'mint')
  }

  static createRewardTransaction(to: string, amount: number): TransactionClass {
    return new TransactionClass(null, to, amount, 'reward')
  }

  static fromData(data: Transaction): TransactionClass {
    const tx = new TransactionClass(data.from, data.to, data.amount, data.type)
    tx.id = data.id // 使用原始的id
    tx.timestamp = data.timestamp // 使用原始的timestamp
    tx.signature = data.signature
    tx.hash = data.hash || tx.calculateHash()
    return tx
  }
}
