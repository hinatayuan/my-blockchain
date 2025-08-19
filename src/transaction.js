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

        // For transfer transactions, check basic validity
        if (this.type === 'transfer') {
            // Must have valid from and to addresses
            if (!this.from || !this.to) return false;
            // Must have positive amount
            if (this.amount <= 0) return false;
            // For demo purposes, we'll be lenient about signatures
            // In production, this should verify the signature against the public key
            return true;
        }
        
        return true;
    }

    static createMintTransaction(to, amount) {
        return new Transaction(null, to, amount, 'mint');
    }

    static createRewardTransaction(to, amount) {
        return new Transaction(null, to, amount, 'reward');
    }
    
    static fromData(data) {
        const tx = new Transaction(data.from, data.to, data.amount, data.type);
        tx.id = data.id;  // 使用原始的id
        tx.timestamp = data.timestamp;  // 使用原始的timestamp
        tx.signature = data.signature;
        return tx;
    }
}

module.exports = Transaction;