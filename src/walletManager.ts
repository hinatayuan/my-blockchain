import { Wallet } from './wallet';
import { Blockchain } from './blockchain';
import { ValidationUtils } from './utils/validators';

export class WalletManager {
  private wallets: Map<string, Wallet>;

  constructor() {
    this.wallets = new Map();
  }

  // 创建新钱包
  createWallet(name: string, mnemonic?: string): Wallet {
    if (!ValidationUtils.isValidWalletName(name)) {
      throw new Error('钱包名称无效');
    }

    if (this.wallets.has(name)) {
      throw new Error('钱包名称已存在');
    }

    let wallet: Wallet;
    if (mnemonic) {
      wallet = Wallet.fromMnemonic(mnemonic, name);
    } else {
      wallet = new Wallet(name);
    }

    this.wallets.set(name, wallet);
    console.log(`钱包已创建: ${name} (${wallet.address})`);
    return wallet;
  }

  // 获取钱包
  getWallet(name: string): Wallet | undefined {
    return this.wallets.get(name);
  }

  // 获取所有钱包
  getAllWallets(): Array<{name: string; wallet: Wallet}> {
    return Array.from(this.wallets.entries()).map(([name, wallet]) => ({
      name,
      wallet
    }));
  }

  // 获取钱包列表（带余额）
  getWalletsWithBalances(blockchain: Blockchain): Array<{name: string; address: string; balance: number}> {
    return Array.from(this.wallets.entries()).map(([name, wallet]) => ({
      name,
      address: wallet.address,
      balance: blockchain.getBalance(wallet.address)
    }));
  }

  // 删除钱包
  deleteWallet(name: string): boolean {
    if (this.wallets.has(name)) {
      this.wallets.delete(name);
      console.log(`钱包已删除: ${name}`);
      return true;
    }
    return false;
  }

  // 重命名钱包
  renameWallet(oldName: string, newName: string): boolean {
    if (!ValidationUtils.isValidWalletName(newName)) {
      throw new Error('新钱包名称无效');
    }

    if (this.wallets.has(newName)) {
      throw new Error('新钱包名称已存在');
    }

    const wallet = this.wallets.get(oldName);
    if (wallet) {
      wallet.updateName(newName);
      this.wallets.delete(oldName);
      this.wallets.set(newName, wallet);
      console.log(`钱包已重命名: ${oldName} -> ${newName}`);
      return true;
    }
    return false;
  }

  // 通过地址查找钱包
  findWalletByAddress(address: string): {name: string; wallet: Wallet} | undefined {
    for (const [name, wallet] of this.wallets.entries()) {
      if (wallet.address === address) {
        return {name, wallet};
      }
    }
    return undefined;
  }

  // 导入钱包（从私钥）
  importWallet(name: string, privateKey: string): Wallet {
    if (!ValidationUtils.isValidWalletName(name)) {
      throw new Error('钱包名称无效');
    }

    if (this.wallets.has(name)) {
      throw new Error('钱包名称已存在');
    }

    const wallet = Wallet.fromPrivateKey(privateKey, name);
    this.wallets.set(name, wallet);
    console.log(`钱包已导入: ${name} (${wallet.address})`);
    return wallet;
  }

  // 导出钱包信息
  exportWallet(name: string): object | null {
    const wallet = this.wallets.get(name);
    if (wallet) {
      return wallet.exportWallet();
    }
    return null;
  }

  // 获取钱包数量
  getWalletCount(): number {
    return this.wallets.size;
  }

  // 获取总余额
  getTotalBalance(blockchain: Blockchain): number {
    let total = 0;
    for (const wallet of this.wallets.values()) {
      total += blockchain.getBalance(wallet.address);
    }
    return total;
  }

  // 清空所有钱包
  clear(): void {
    this.wallets.clear();
    console.log('所有钱包已清空');
  }

  // 验证所有钱包
  validateAllWallets(): {valid: boolean; errors: string[]} {
    const errors: string[] = [];
    
    for (const [name, wallet] of this.wallets.entries()) {
      if (!wallet.isValid()) {
        errors.push(`钱包 ${name} 验证失败`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 获取钱包统计信息
  getStatistics(blockchain: Blockchain): object {
    const balances = Array.from(this.wallets.values()).map(wallet => 
      blockchain.getBalance(wallet.address)
    );
    
    const totalBalance = balances.reduce((sum, balance) => sum + balance, 0);
    const averageBalance = this.wallets.size > 0 ? totalBalance / this.wallets.size : 0;
    const maxBalance = balances.length > 0 ? Math.max(...balances) : 0;
    const minBalance = balances.length > 0 ? Math.min(...balances) : 0;
    
    return {
      totalWallets: this.wallets.size,
      totalBalance,
      averageBalance: Math.round(averageBalance * 100) / 100,
      maxBalance,
      minBalance,
      activeWallets: balances.filter(balance => balance > 0).length
    };
  }

  // 批量创建钱包
  createMultipleWallets(names: string[]): Wallet[] {
    const createdWallets: Wallet[] = [];
    
    for (const name of names) {
      try {
        const wallet = this.createWallet(name);
        createdWallets.push(wallet);
      } catch (error) {
        console.error(`创建钱包 ${name} 失败:`, error);
      }
    }
    
    return createdWallets;
  }

  // 备份所有钱包
  backupAllWallets(): object {
    const backup: any = {
      timestamp: Date.now(),
      wallets: []
    };
    
    for (const [name, wallet] of this.wallets.entries()) {
      backup.wallets.push({
        name,
        ...wallet.exportWallet()
      });
    }
    
    return backup;
  }

  // 从备份恢复钱包
  restoreFromBackup(backup: any): number {
    let restoredCount = 0;
    
    if (backup.wallets && Array.isArray(backup.wallets)) {
      for (const walletData of backup.wallets) {
        try {
          if (!this.wallets.has(walletData.name)) {
            const wallet = new Wallet(walletData.name);
            wallet.id = walletData.id;
            wallet.privateKey = walletData.privateKey;
            wallet.publicKey = walletData.publicKey;
            wallet.address = walletData.address;
            wallet.mnemonic = walletData.mnemonic;
            wallet.createdAt = walletData.createdAt;
            
            this.wallets.set(walletData.name, wallet);
            restoredCount++;
          }
        } catch (error) {
          console.error(`恢复钱包 ${walletData.name} 失败:`, error);
        }
      }
    }
    
    console.log(`成功恢复 ${restoredCount} 个钱包`);
    return restoredCount;
  }
}