const CryptoUtils = require('./crypto');
const Transaction = require('./transaction');

class Wallet {
    constructor() {
        const keyPair = CryptoUtils.generateKeyPair();
        this.privateKey = keyPair.privateKey;
        this.publicKey = keyPair.publicKey;
        this.address = CryptoUtils.generateAddress(this.publicKey);
    }

    static fromKeys(privateKey, publicKey) {
        const wallet = Object.create(Wallet.prototype);
        wallet.privateKey = privateKey;
        wallet.publicKey = publicKey;
        wallet.address = CryptoUtils.generateAddress(publicKey);
        return wallet;
    }

    getBalance(blockchain) {
        return blockchain.getBalance(this.address);
    }

    sendMoney(amount, payeeAddress, blockchain) {
        if (this.getBalance(blockchain) < amount) {
            throw new Error('Not enough balance');
        }

        const transaction = new Transaction(this.address, payeeAddress, amount, 'transfer');
        transaction.signTransaction(this.privateKey);
        
        blockchain.createTransaction(transaction);
        return transaction;
    }

    getPublicInfo() {
        return {
            address: this.address,
            publicKey: this.publicKey
        };
    }

    getPrivateInfo() {
        return {
            address: this.address,
            publicKey: this.publicKey,
            privateKey: this.privateKey
        };
    }
}

class WalletManager {
    constructor() {
        this.wallets = new Map();
    }

    createWallet(name) {
        if (this.wallets.has(name)) {
            throw new Error('Wallet with this name already exists');
        }

        const wallet = new Wallet();
        this.wallets.set(name, wallet);
        return wallet;
    }

    importWallet(name, privateKey, publicKey) {
        if (this.wallets.has(name)) {
            throw new Error('Wallet with this name already exists');
        }

        const wallet = Wallet.fromKeys(privateKey, publicKey);
        this.wallets.set(name, wallet);
        return wallet;
    }

    getWallet(name) {
        return this.wallets.get(name);
    }

    getAllWallets() {
        const walletList = [];
        for (const [name, wallet] of this.wallets) {
            walletList.push({
                name,
                ...wallet.getPublicInfo()
            });
        }
        return walletList;
    }

    deleteWallet(name) {
        return this.wallets.delete(name);
    }

    getWalletBalances(blockchain) {
        const balances = {};
        for (const [name, wallet] of this.wallets) {
            balances[name] = {
                address: wallet.address,
                balance: wallet.getBalance(blockchain)
            };
        }
        return balances;
    }
}

module.exports = { Wallet, WalletManager };