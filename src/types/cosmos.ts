export interface CosmosAccount {
  address: string;
  coins: Coin[];
  accountNumber: number;
  sequence: number;
}

export interface Coin {
  denom: string;
  amount: string;
}

export interface CosmosTransaction {
  hash: string;
  height: number;
  timestamp: string;
  fee: Coin[];
  memo: string;
  messages: any[];
}

export interface CosmosBlockData {
  height: number;
  hash: string;
  timestamp: string;
  transactions: CosmosTransaction[];
  proposer: string;
}

export interface CosmosChainInfo {
  chainId: string;
  rpcEndpoint: string;
  restEndpoint: string;
  coinType: number;
  bech32Prefix: string;
}

export interface CosmosWalletInfo {
  address: string;
  mnemonic: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}