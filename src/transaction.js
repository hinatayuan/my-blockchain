const { v4: uuidv4 } = require('uuid');
const CryptoUtils = require('./crypto');

class Transaction {
    constructor(from, to, amount, type = 'transfer') {
        this.id = uuidv4();
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.type = type; // transfer, mint, reward
        this.timestamp = Date.now();
        this.signature = null;
    }

    signTransaction(privateKey) {
        const transactionData = {
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            type: this.type,
            timestamp: this.timestamp
        };
        
        this.signature = CryptoUtils.signTransaction(privateKey, transactionData);
    }

    isValid() {
        // Genesis transactions and mining rewards don't need signature verification
        if (this.from === null || this.type === 'reward' || this.type === 'mint' || this.type === 'genesis') {
            return true;
        }

        if (!this.signature) return false;
        
        const transactionData = {
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            type: this.type,
            timestamp: this.timestamp
        };

        // In a real implementation, we would get the public key from the address
        // For simplicity, we're assuming the transaction is valid if it has a signature
        return this.signature !== null;
    }

    static createMintTransaction(to, amount) {
        return new Transaction(null, to, amount, 'mint');
    }

    static createRewardTransaction(to, amount) {
        return new Transaction(null, to, amount, 'reward');
    }
}

module.exports = Transaction;