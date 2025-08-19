const Block = require('./block');
const Transaction = require('./transaction');
const CryptoUtils = require('./crypto');

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.balances = new Map();
        this.validators = new Map(); // 验证者和他们的权益
        this.blockTime = 6000; // 6秒出块时间（类似Cosmos）
        this.autoForging = false;
        this.forgingInterval = null;
    }

    createGenesisBlock() {
        const genesisTransaction = new Transaction(null, 'genesis', 0, 'genesis');
        return new Block(Date.parse('2024-01-01'), [genesisTransaction], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        // 向后兼容：将挖矿改为验证者锻造
        return this.forgePendingTransactions(miningRewardAddress);
    }

    createTransaction(transaction) {
        // Validate transaction
        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        // Check if sender has enough balance (except for mint and reward transactions)
        if (transaction.from && transaction.type === 'transfer') {
            const balance = this.getBalance(transaction.from);
            if (balance < transaction.amount) {
                throw new Error('Not enough balance');
            }
        }

        this.pendingTransactions.push(transaction);
    }

    getBalance(address) {
        if (this.balances.has(address)) {
            return this.balances.get(address);
        }

        let balance = 0;

        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.from === address) {
                    balance -= transaction.amount;
                }

                if (transaction.to === address) {
                    balance += transaction.amount;
                }
            }
        }

        // Include pending transactions
        for (const transaction of this.pendingTransactions) {
            if (transaction.from === address) {
                balance -= transaction.amount;
            }

            if (transaction.to === address) {
                balance += transaction.amount;
            }
        }

        this.balances.set(address, balance);
        return balance;
    }

    updateBalances(block) {
        for (const transaction of block.transactions) {
            if (transaction.from) {
                const currentBalance = this.getBalance(transaction.from);
                this.balances.set(transaction.from, currentBalance - transaction.amount);
            }

            if (transaction.to) {
                const currentBalance = this.getBalance(transaction.to);
                this.balances.set(transaction.to, currentBalance + transaction.amount);
            }
        }
    }

    getAllTransactions() {
        const transactions = [];
        for (const block of this.chain) {
            transactions.push(...block.transactions);
        }
        return transactions;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }

    getBlockchainInfo() {
        let isValid = true;
        try {
            isValid = this.isChainValid();
        } catch (error) {
            console.warn('区块链验证失败，但继续运行:', error.message);
            isValid = false;
        }
        
        return {
            height: this.chain.length,
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.length,
            totalSupply: Array.from(this.balances.values()).reduce((a, b) => a + b, 0),
            isValid: isValid,
            consensus: 'proof-of-stake',
            validators: this.validators.size,
            autoForging: this.autoForging,
            blockTime: this.blockTime / 1000 + 's'
        };
    }

    getBlock(index) {
        if (index >= 0 && index < this.chain.length) {
            return this.chain[index];
        }
        return null;
    }

    mintTokens(to, amount) {
        const mintTransaction = Transaction.createMintTransaction(to, amount);
        this.createTransaction(mintTransaction);
        return mintTransaction;
    }

    // PoS 验证者管理
    addValidator(address, stake) {
        if (stake >= 1000) { // 最少1000代币才能成为验证者
            this.validators.set(address, stake);
            console.log(`Validator added: ${address} with stake: ${stake}`);
        }
    }

    removeValidator(address) {
        this.validators.delete(address);
        console.log(`Validator removed: ${address}`);
    }

    updateValidatorStake(address, newStake) {
        if (this.validators.has(address)) {
            if (newStake >= 1000) {
                this.validators.set(address, newStake);
            } else {
                this.removeValidator(address);
            }
        }
    }

    // 基于权益随机选择验证者
    selectValidator() {
        if (this.validators.size === 0) {
            // 如果没有验证者，自动将有足够余额的地址设为验证者
            for (const [address, balance] of this.balances.entries()) {
                if (balance >= 1000) {
                    this.addValidator(address, balance);
                }
            }
        }

        if (this.validators.size === 0) {
            return null;
        }

        // 计算总权益
        let totalStake = 0;
        for (const stake of this.validators.values()) {
            totalStake += stake;
        }

        // 权益加权随机选择
        let random = Math.random() * totalStake;
        for (const [address, stake] of this.validators.entries()) {
            random -= stake;
            if (random <= 0) {
                return address;
            }
        }

        // 回退：返回第一个验证者
        return this.validators.keys().next().value;
    }

    // PoS 区块锻造
    forgePendingTransactions(validatorAddress = null) {
        const selectedValidator = validatorAddress || this.selectValidator();
        
        if (!selectedValidator) {
            console.log('No validators available for block forging');
            return;
        }

        const rewardTransaction = Transaction.createRewardTransaction(
            selectedValidator, 
            this.miningReward
        );
        this.pendingTransactions.push(rewardTransaction);

        const block = new Block(
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash,
            selectedValidator
        );

        block.forgeBlock();

        console.log(`Block forged by validator: ${selectedValidator}`);
        this.chain.push(block);

        // Update balances
        this.updateBalances(block);
        
        // Update validator stakes
        this.updateValidatorStake(selectedValidator, this.getBalance(selectedValidator));

        this.pendingTransactions = [];
        
        // 触发事件回调（如果有的话）
        if (this.onBlockForged) {
            this.onBlockForged(block, selectedValidator);
        }
        
        return block;
    }

    // 启动自动出块
    startAutoForging() {
        if (this.autoForging) return;
        
        this.autoForging = true;
        console.log('Auto-forging started with', this.blockTime / 1000, 'second intervals');
        
        this.forgingInterval = setInterval(() => {
            if (this.pendingTransactions.length > 0) {
                this.forgePendingTransactions();
            }
        }, this.blockTime);
    }

    // 停止自动出块
    stopAutoForging() {
        if (!this.autoForging) return;
        
        this.autoForging = false;
        if (this.forgingInterval) {
            clearInterval(this.forgingInterval);
            this.forgingInterval = null;
        }
        console.log('Auto-forging stopped');
    }
}

module.exports = Blockchain;