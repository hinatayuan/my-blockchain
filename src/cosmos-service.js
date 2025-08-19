const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningStargateClient, GasPrice } = require('@cosmjs/stargate');
const { coins } = require('@cosmjs/amino');

class CosmosService {
    constructor() {
        this.client = null;
        this.wallets = new Map(); // 存储钱包信息 name -> {wallet, address, mnemonic}
        this.localBalances = new Map(); // 存储本地模拟余额 address -> amount
        this.faucetHistory = new Map(); // 存储水龙头使用历史
        this.rpcEndpoint = 'https://rpc-cosmoshub.blockapsis.com';
        this.denom = 'uatom';
    }

    async connectToNetwork(rpcEndpoint = null) {
        try {
            if (rpcEndpoint) {
                this.rpcEndpoint = rpcEndpoint;
            }

            // 创建一个临时钱包来测试连接
            const tempWallet = await DirectSecp256k1HdWallet.generate(12, {
                prefix: 'cosmos'
            });

            this.client = await SigningStargateClient.connectWithSigner(
                this.rpcEndpoint,
                tempWallet,
                {
                    gasPrice: GasPrice.fromString('0.025uatom')
                }
            );

            return {
                connected: true,
                rpcEndpoint: this.rpcEndpoint,
                chainId: await this.client.getChainId(),
                height: await this.client.getHeight()
            };
        } catch (error) {
            console.error('Failed to connect to Cosmos network:', error);
            // 返回离线模式状态而不是抛出错误
            return {
                connected: false,
                rpcEndpoint: this.rpcEndpoint,
                chainId: 'offline-mode',
                height: 0,
                error: error.message
            };
        }
    }

    async createWallet(name) {
        try {
            if (this.wallets.has(name)) {
                throw new Error('钱包名称已存在');
            }

            const wallet = await DirectSecp256k1HdWallet.generate(12, {
                prefix: 'cosmos'
            });

            const [account] = await wallet.getAccounts();
            const address = account.address;

            this.wallets.set(name, {
                wallet,
                address,
                mnemonic: wallet.mnemonic
            });

            return {
                name,
                address,
                mnemonic: wallet.mnemonic,
                balance: 0
            };
        } catch (error) {
            throw new Error(`创建钱包失败: ${error.message}`);
        }
    }

    async importWallet(name, mnemonic) {
        try {
            if (this.wallets.has(name)) {
                throw new Error('钱包名称已存在');
            }

            const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                prefix: 'cosmos'
            });

            const [account] = await wallet.getAccounts();
            const address = account.address;

            this.wallets.set(name, {
                wallet,
                address,
                mnemonic
            });

            return {
                name,
                address,
                balance: await this.getBalance(address)
            };
        } catch (error) {
            throw new Error(`导入钱包失败: ${error.message}`);
        }
    }

    async getBalance(address) {
        try {
            if (!this.client) {
                const result = await this.connectToNetwork();
                if (!result.connected) {
                    // 离线模式：返回本地余额或默认余额
                    return this.localBalances.get(address) || Math.floor(Math.random() * 500) + 100;
                }
            }

            const balance = await this.client.getBalance(address, this.denom);
            return parseInt(balance.amount) || 0;
        } catch (error) {
            console.error('获取余额失败:', error);
            // 离线模式：返回本地余额或默认余额
            return this.localBalances.get(address) || Math.floor(Math.random() * 500) + 100;
        }
    }

    // 更新本地余额
    updateLocalBalance(address, amount) {
        this.localBalances.set(address, amount);
    }

    // 增加本地余额
    addToLocalBalance(address, amount) {
        const currentBalance = this.localBalances.get(address) || 0;
        this.localBalances.set(address, currentBalance + amount);
    }

    // 减少本地余额
    subtractFromLocalBalance(address, amount) {
        const currentBalance = this.localBalances.get(address) || 0;
        const newBalance = Math.max(0, currentBalance - amount);
        this.localBalances.set(address, newBalance);
        return newBalance;
    }

    async getAllWallets() {
        const walletList = [];
        for (const [name, walletInfo] of this.wallets) {
            const balance = await this.getBalance(walletInfo.address);
            walletList.push({
                name,
                address: walletInfo.address,
                balance
            });
        }
        return walletList;
    }

    async sendTokens(fromWalletName, toAddress, amount, memo = '') {
        try {
            const walletInfo = this.wallets.get(fromWalletName);
            if (!walletInfo) {
                throw new Error('发送方钱包不存在');
            }

            // 检查余额（在离线模式下使用模拟余额）
            const balance = await this.getBalance(walletInfo.address);
            if (balance < amount) {
                throw new Error('余额不足');
            }

            // 尝试连接网络
            if (!this.client) {
                const result = await this.connectToNetwork();
                if (!result.connected) {
                    // 离线模式：更新本地余额并模拟成功的交易
                    this.subtractFromLocalBalance(walletInfo.address, amount);
                    this.addToLocalBalance(toAddress, amount);
                    
                    return {
                        success: true,
                        transactionHash: `offline_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        height: Math.floor(Math.random() * 1000000),
                        gasUsed: Math.floor(Math.random() * 50000) + 20000,
                        from: walletInfo.address,
                        to: toAddress,
                        amount,
                        memo,
                        offline: true
                    };
                }
            }

            // 在线模式：执行真实交易
            const client = await SigningStargateClient.connectWithSigner(
                this.rpcEndpoint,
                walletInfo.wallet,
                {
                    gasPrice: GasPrice.fromString('0.025uatom')
                }
            );

            const sendAmount = coins(amount, this.denom);
            const result = await client.sendTokens(
                walletInfo.address,
                toAddress,
                sendAmount,
                'auto',
                memo
            );

            return {
                success: result.code === 0,
                transactionHash: result.transactionHash,
                height: result.height,
                gasUsed: result.gasUsed,
                from: walletInfo.address,
                to: toAddress,
                amount,
                memo,
                offline: false
            };
        } catch (error) {
            // 如果是网络错误，返回离线模式的模拟交易
            if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
                const walletInfo = this.wallets.get(fromWalletName);
                // 更新本地余额
                this.subtractFromLocalBalance(walletInfo.address, amount);
                this.addToLocalBalance(toAddress, amount);
                
                return {
                    success: true,
                    transactionHash: `offline_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    height: Math.floor(Math.random() * 1000000),
                    gasUsed: Math.floor(Math.random() * 50000) + 20000,
                    from: walletInfo.address,
                    to: toAddress,
                    amount,
                    memo,
                    offline: true
                };
            }
            throw new Error(`转账失败: ${error.message}`);
        }
    }

    async getTransactionHistory() {
        try {
            if (!this.client) {
                await this.connectToNetwork();
            }

            const transactions = [];
            for (const [name, walletInfo] of this.wallets) {
                // 这里应该实现真实的交易历史查询
                // 由于需要额外的索引服务，这里返回模拟数据
                transactions.push({
                    id: `tx_${Date.now()}`,
                    from: walletInfo.address,
                    to: 'cosmos1...',
                    amount: 100,
                    type: 'transfer',
                    timestamp: Date.now(),
                    height: await this.client.getHeight()
                });
            }
            return transactions;
        } catch (error) {
            console.error('获取交易历史失败:', error);
            return [];
        }
    }

    async getNetworkInfo() {
        try {
            if (!this.client) {
                const result = await this.connectToNetwork();
                if (!result.connected) {
                    return {
                        height: Math.floor(Math.random() * 1000000),
                        chainId: 'offline-demo-mode',
                        connected: false,
                        rpcEndpoint: this.rpcEndpoint,
                        denom: this.denom
                    };
                }
            }

            return {
                height: await this.client.getHeight(),
                chainId: await this.client.getChainId(),
                connected: true,
                rpcEndpoint: this.rpcEndpoint,
                denom: this.denom
            };
        } catch (error) {
            return {
                height: Math.floor(Math.random() * 1000000),
                chainId: 'offline-demo-mode',
                connected: false,
                rpcEndpoint: this.rpcEndpoint,
                denom: this.denom,
                error: error.message
            };
        }
    }

    deleteWallet(name) {
        return this.wallets.delete(name);
    }

    getWallet(name) {
        return this.wallets.get(name);
    }

    // 模拟挖矿功能 - 在真实Cosmos网络中不需要此功能
    async simulateMining(minerWalletName) {
        const walletInfo = this.wallets.get(minerWalletName);
        if (!walletInfo) {
            throw new Error('矿工钱包不存在');
        }

        // 模拟挖矿奖励
        return {
            success: true,
            reward: 100,
            minerAddress: walletInfo.address,
            blockHeight: await this.getNetworkInfo().then(info => info.height)
        };
    }

    // 水龙头功能 - 为钱包提供测试代币
    async faucetRequest(walletName, amount = 1000) {
        try {
            const walletInfo = this.wallets.get(walletName);
            if (!walletInfo) {
                throw new Error('钱包不存在');
            }

            // 检查是否已经请求过水龙头（简单的防护机制）
            const lastFaucetKey = `faucet_${walletInfo.address}`;
            const lastFaucetTime = this.faucetHistory?.get(lastFaucetKey) || 0;
            const now = Date.now();
            const cooldownTime = 5 * 60 * 1000; // 5分钟冷却（测试用）

            if (now - lastFaucetTime < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - (now - lastFaucetTime)) / (60 * 1000));
                throw new Error(`水龙头冷却中，请等待 ${remainingTime} 分钟后再试`);
            }

            // 初始化水龙头历史记录
            if (!this.faucetHistory) {
                this.faucetHistory = new Map();
            }

            // 记录此次水龙头请求
            this.faucetHistory.set(lastFaucetKey, now);

            // 增加钱包的本地余额
            this.addToLocalBalance(walletInfo.address, amount);

            // 在离线模式下直接返回成功
            return {
                success: true,
                amount,
                address: walletInfo.address,
                transactionHash: `faucet_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                message: `成功从水龙头获得 ${amount} 测试代币`,
                offline: true
            };
        } catch (error) {
            throw new Error(`水龙头请求失败: ${error.message}`);
        }
    }

    // 检查钱包是否可以使用水龙头
    canUseFaucet(walletName) {
        const walletInfo = this.wallets.get(walletName);
        if (!walletInfo) {
            return { canUse: false, reason: '钱包不存在' };
        }

        const lastFaucetKey = `faucet_${walletInfo.address}`;
        const lastFaucetTime = this.faucetHistory?.get(lastFaucetKey) || 0;
        const now = Date.now();
        const cooldownTime = 5 * 60 * 1000; // 5分钟冷却（测试用）

        if (now - lastFaucetTime < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - lastFaucetTime)) / (60 * 1000));
            return { 
                canUse: false, 
                reason: `水龙头冷却中，还需等待 ${remainingTime} 分钟` 
            };
        }

        return { canUse: true, reason: '可以使用水龙头' };
    }

    // 重置水龙头冷却（测试用）
    resetFaucetCooldown(walletName) {
        const walletInfo = this.wallets.get(walletName);
        if (!walletInfo) {
            return { success: false, message: '钱包不存在' };
        }

        const lastFaucetKey = `faucet_${walletInfo.address}`;
        if (this.faucetHistory) {
            this.faucetHistory.delete(lastFaucetKey);
        }
        
        return { 
            success: true, 
            message: `钱包 ${walletName} 的水龙头冷却已重置` 
        };
    }

    // 获取区块链信息
    async getBlockchainInfo() {
        try {
            const networkInfo = await this.getNetworkInfo();
            const allWallets = await this.getAllWallets();
            const totalBalance = allWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

            return {
                height: networkInfo.height,
                chainId: networkInfo.chainId,
                totalSupply: totalBalance,
                activeWallets: allWallets.length,
                isValid: true,
                rpcEndpoint: this.rpcEndpoint
            };
        } catch (error) {
            return {
                height: 0,
                chainId: 'unknown',
                totalSupply: 0,
                activeWallets: 0,
                isValid: false,
                error: error.message
            };
        }
    }
}

module.exports = CosmosService;