const CryptoUtils = require('./crypto');

class Block {
    constructor(timestamp, transactions, previousHash = '', validator = null) {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.validator = validator; // PoS验证者
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return CryptoUtils.hash({
            timestamp: this.timestamp,
            transactions: this.transactions,
            previousHash: this.previousHash,
            validator: this.validator,
            nonce: this.nonce
        });
    }

    // PoS: 锻造区块而不是挖矿
    forgeBlock() {
        // 在PoS中，验证者不需要解决计算难题
        // 只需要证明他们拥有足够的权益
        this.hash = this.calculateHash();
        console.log(`Block forged by validator ${this.validator}: ${this.hash}`);
    }

    // 保留原方法以兼容现有代码
    mineBlock(difficulty) {
        this.forgeBlock();
    }

    hasValidTransactions() {
        for (const transaction of this.transactions) {
            if (!transaction.isValid()) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Block;