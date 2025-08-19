const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');

const Blockchain = require('./blockchain');
const { WalletManager } = require('./wallet');
const Transaction = require('./transaction');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5002;

// Initialize blockchain and wallet manager
const myBlockchain = new Blockchain();
const walletManager = new WalletManager();

// Data persistence paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const BLOCKCHAIN_FILE = path.join(DATA_DIR, 'blockchain.json');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Save blockchain data
function saveBlockchainData() {
    try {
        const blockchainData = {
            chain: myBlockchain.chain,
            difficulty: myBlockchain.difficulty,
            pendingTransactions: myBlockchain.pendingTransactions,
            miningReward: myBlockchain.miningReward,
            balances: Array.from(myBlockchain.balances.entries())
        };
        fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchainData, null, 2));
    } catch (error) {
        console.error('Failed to save blockchain data:', error);
    }
}

// Save wallet data
function saveWalletData() {
    try {
        const walletData = [];
        for (const [name, wallet] of walletManager.wallets) {
            walletData.push({
                name,
                privateKey: wallet.privateKey,
                publicKey: wallet.publicKey,
                address: wallet.address
            });
        }
        fs.writeFileSync(WALLETS_FILE, JSON.stringify(walletData, null, 2));
    } catch (error) {
        console.error('Failed to save wallet data:', error);
    }
}

// Load blockchain data
function loadBlockchainData() {
    try {
        if (fs.existsSync(BLOCKCHAIN_FILE)) {
            const data = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE, 'utf8'));
            myBlockchain.chain = data.chain;
            myBlockchain.difficulty = data.difficulty || 2;
            myBlockchain.pendingTransactions = data.pendingTransactions || [];
            myBlockchain.miningReward = data.miningReward || 100;
            if (data.balances) {
                myBlockchain.balances = new Map(data.balances);
            }
            console.log('Blockchain data loaded successfully');
            return true;
        }
    } catch (error) {
        console.error('Failed to load blockchain data:', error);
    }
    return false;
}

// Load wallet data
function loadWalletData() {
    try {
        if (fs.existsSync(WALLETS_FILE)) {
            const data = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
            for (const walletData of data) {
                const { Wallet } = require('./wallet');
                const wallet = Wallet.fromKeys(walletData.privateKey, walletData.publicKey);
                walletManager.wallets.set(walletData.name, wallet);
            }
            console.log('Wallet data loaded successfully');
            return true;
        }
    } catch (error) {
        console.error('Failed to load wallet data:', error);
    }
    return false;
}

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain endpoints
app.get('/api/blockchain/info', (req, res) => {
    res.json(myBlockchain.getBlockchainInfo());
});

app.get('/api/blockchain/blocks', (req, res) => {
    res.json(myBlockchain.chain);
});

app.get('/api/blockchain/blocks/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const block = myBlockchain.getBlock(index);
    
    if (block) {
        res.json(block);
    } else {
        res.status(404).json({ error: '区块不存在' });
    }
});

app.get('/api/blockchain/transactions', (req, res) => {
    res.json(myBlockchain.getAllTransactions());
});

app.get('/api/blockchain/pending-transactions', (req, res) => {
    res.json(myBlockchain.pendingTransactions);
});

// Wallet endpoints
app.post('/api/wallets', (req, res) => {
    try {
        const { name, mnemonic } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: '钱包名称不能为空' });
        }

        const wallet = walletManager.createWallet(name);
        saveWalletData();
        
        io.emit('walletCreated', {
            name,
            ...wallet.getPublicInfo(),
            balance: wallet.getBalance(myBlockchain)
        });
        
        res.json({
            name,
            ...wallet.getPublicInfo(),
            balance: wallet.getBalance(myBlockchain)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/wallets', (req, res) => {
    const wallets = walletManager.getAllWallets();
    const walletsWithBalances = wallets.map(wallet => ({
        ...wallet,
        balance: myBlockchain.getBalance(wallet.address)
    }));
    res.json(walletsWithBalances);
});

app.get('/api/wallets/:name', (req, res) => {
    const wallet = walletManager.getWallet(req.params.name);
    if (wallet) {
        res.json({
            name: req.params.name,
            ...wallet.getPublicInfo(),
            balance: wallet.getBalance(myBlockchain)
        });
    } else {
        res.status(404).json({ error: '钱包不存在' });
    }
});

app.delete('/api/wallets/:name', (req, res) => {
    const success = walletManager.deleteWallet(req.params.name);
    if (success) {
        saveWalletData();
        io.emit('walletDeleted', req.params.name);
        res.json({ message: '钱包删除成功' });
    } else {
        res.status(404).json({ error: '钱包不存在' });
    }
});

// Transaction endpoints
app.post('/api/transactions', (req, res) => {
    try {
        const { fromWalletName, to, amount, memo = '' } = req.body;
        const wallet = walletManager.getWallet(fromWalletName);
        
        if (!wallet) {
            return res.status(404).json({ error: '发送方钱包不存在' });
        }

        const transaction = wallet.sendMoney(amount, to, myBlockchain);
        saveBlockchainData();
        
        io.emit('newTransaction', {
            from: transaction.from,
            to: transaction.to,
            amount: transaction.amount,
            hash: transaction.hash,
            type: transaction.type,
            timestamp: transaction.timestamp
        });
        
        res.json({
            message: '交易创建成功',
            transaction: {
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                hash: transaction.hash,
                type: transaction.type
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mining endpoints
app.post('/api/mine', (req, res) => {
    try {
        const { minerWalletName } = req.body;
        
        if (!minerWalletName) {
            return res.status(400).json({ error: '需要指定矿工钱包' });
        }

        const minerWallet = walletManager.getWallet(minerWalletName);
        if (!minerWallet) {
            return res.status(404).json({ error: '矿工钱包不存在' });
        }

        myBlockchain.minePendingTransactions(minerWallet.address);
        saveBlockchainData();
        
        const latestBlock = myBlockchain.getLatestBlock();
        
        io.emit('blockMined', {
            miner: minerWallet.address,
            reward: myBlockchain.miningReward,
            height: myBlockchain.chain.length - 1,
            block: latestBlock
        });
        
        res.json({
            message: '区块挖掘成功',
            reward: myBlockchain.miningReward,
            height: myBlockchain.chain.length - 1,
            block: latestBlock
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Faucet endpoints (铸造代币)
app.post('/api/faucet', (req, res) => {
    try {
        const { walletName, amount = 1000 } = req.body;
        
        if (!walletName) {
            return res.status(400).json({ error: '需要指定钱包名称' });
        }

        const wallet = walletManager.getWallet(walletName);
        if (!wallet) {
            return res.status(404).json({ error: '钱包不存在' });
        }

        const transaction = myBlockchain.mintTokens(wallet.address, amount);
        saveBlockchainData();
        
        io.emit('faucetUsed', {
            walletName,
            amount,
            address: wallet.address,
            transactionHash: transaction.hash
        });
        
        res.json({
            message: `成功铸造 ${amount} 代币到钱包 ${walletName}`,
            transaction: {
                to: wallet.address,
                amount,
                hash: transaction.hash,
                type: transaction.type
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Token minting endpoints
app.post('/api/mint', (req, res) => {
    try {
        const { to, amount, walletName } = req.body;
        let targetAddress = to;

        // 如果提供了钱包名称，获取钱包地址
        if (walletName) {
            const wallet = walletManager.getWallet(walletName);
            if (!wallet) {
                return res.status(404).json({ error: '钱包不存在' });
            }
            targetAddress = wallet.address;
        }

        if (!targetAddress) {
            return res.status(400).json({ error: '需要指定目标地址或钱包名称' });
        }
        
        const transaction = myBlockchain.mintTokens(targetAddress, amount);
        saveBlockchainData();
        
        io.emit('tokensMinted', transaction);
        
        res.json({
            message: '代币铸造成功',
            transaction: {
                to: targetAddress,
                amount,
                hash: transaction.hash,
                type: transaction.type
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('客户端连接:', socket.id);
    
    // Send initial blockchain state
    socket.emit('blockchainState', {
        blockchain: myBlockchain.getBlockchainInfo(),
        wallets: walletManager.getAllWallets().map(wallet => ({
            ...wallet,
            balance: myBlockchain.getBalance(wallet.address)
        })),
        blocks: myBlockchain.chain,
        pendingTransactions: myBlockchain.pendingTransactions
    });

    socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
    });
});

// Initialize demo data if no existing data
const initializeDemo = () => {
    const hasBlockchainData = loadBlockchainData();
    const hasWalletData = loadWalletData();

    if (!hasBlockchainData && !hasWalletData) {
        console.log('初始化演示数据...');
        
        // Create some demo wallets
        const alice = walletManager.createWallet('Alice');
        const bob = walletManager.createWallet('Bob');
        const charlie = walletManager.createWallet('Charlie');
        
        // Mint some initial tokens
        myBlockchain.mintTokens(alice.address, 1000);
        myBlockchain.mintTokens(bob.address, 500);
        
        // Mine the initial block
        myBlockchain.minePendingTransactions(charlie.address);
        
        // Save initial data
        saveBlockchainData();
        saveWalletData();
        
        console.log('演示数据初始化完成！');
        console.log('Alice 地址:', alice.address);
        console.log('Bob 地址:', bob.address);
        console.log('Charlie 地址:', charlie.address);
    } else {
        console.log('从文件加载现有数据');
    }
    
    console.log('区块链高度:', myBlockchain.chain.length);
    console.log('待处理交易:', myBlockchain.pendingTransactions.length);
    console.log('钱包数量:', walletManager.wallets.size);
};

// Auto-save data periodically
setInterval(() => {
    saveBlockchainData();
    saveWalletData();
}, 30000); // Save every 30 seconds

// Start server
server.listen(PORT, () => {
    console.log(`本地区块链服务器运行在端口 ${PORT}`);
    initializeDemo();
});

module.exports = { app, server, myBlockchain, walletManager };