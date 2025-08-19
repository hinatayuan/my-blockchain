export interface BlockData {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  type: 'transfer' | 'mint' | 'burn';
  signature?: string;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  privateKey: string;
  balance: number;
  mnemonic?: string;
}

export interface BlockchainInfo {
  height: number;
  difficulty: number;
  totalSupply: number;
  pendingTransactions: number;
  isValid: boolean;
  lastBlockHash: string;
  networkHashRate: number;
}

export interface MiningReward {
  amount: number;
  recipient: string;
}

export interface NetworkStatus {
  connectedPeers: number;
  syncStatus: 'synced' | 'syncing' | 'disconnected';
  latestBlockTime: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SocketEvents {
  blockchainState: (data: {
    blockchain: BlockchainInfo;
    blocks: BlockData[];
    pendingTransactions: Transaction[];
  }) => void;
  newTransaction: (transaction: Transaction) => void;
  blockMined: (block: BlockData) => void;
  tokensMinted: (transaction: Transaction) => void;
  walletBalanceUpdate: (data: { address: string; balance: number }) => void;
}

export type BlockchainMode = 'local' | 'cosmos';