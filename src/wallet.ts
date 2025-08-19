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
    const wallet = Object.create(Wallet.prototype)
    wallet.privateKey = privateKey
    wallet.publicKey = publicKey
    wallet.address = CryptoUtils.generateAddress(publicKey)
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

  importWallet(name: string, privateKey: string, publicKey: string): Wallet {
    if (this.wallets.has(name)) {
      throw new Error('Wallet with this name already exists')
    }

    const wallet = Wallet.fromKeys(privateKey, publicKey)
    this.wallets.set(name, wallet)
    return wallet
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
