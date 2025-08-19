const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const CosmosService = require('./cosmos-service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5002;

// Initialize Cosmos service
const cosmosService = new CosmosService();

// Middleware
app.use(cors());
app.use(express.json());

// Network connection endpoints
app.post('/api/network/connect', async (req, res) => {
    try {
        const { rpcEndpoint } = req.body;
        const result = await cosmosService.connectToNetwork(rpcEndpoint);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/network/info', async (req, res) => {
    try {
        const info = await cosmosService.getNetworkInfo();
        res.json(info);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Blockchain info endpoint
app.get('/api/blockchain/info', async (req, res) => {
    try {
        const info = await cosmosService.getBlockchainInfo();
        res.json(info);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mock endpoints for compatibility (不再使用本地区块链)
app.get('/api/blockchain/blocks', (req, res) => {
    res.json([{
        timestamp: Date.now(),
        transactions: [],
        previousHash: '',
        hash: 'cosmos-network-block',
        nonce: 0
    }]);
});

app.get('/api/blockchain/blocks/:index', (req, res) => {
    res.json({
        timestamp: Date.now(),
        transactions: [],
        previousHash: '',
        hash: 'cosmos-network-block',
        nonce: 0
    });
});

app.get('/api/blockchain/transactions', async (req, res) => {
    try {
        const transactions = await cosmosService.getTransactionHistory();
        res.json(transactions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/blockchain/pending-transactions', (req, res) => {
    res.json([]); // Cosmos网络不需要待处理交易
});

// Wallet endpoints
app.post('/api/wallets', async (req, res) => {
    try {
        const { name, mnemonic } = req.body;
        let wallet;
        
        if (mnemonic) {
            wallet = await cosmosService.importWallet(name, mnemonic);
        } else {
            wallet = await cosmosService.createWallet(name);
        }
        
        io.emit('walletCreated', wallet);
        res.json(wallet);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/wallets', async (req, res) => {
    try {
        const wallets = await cosmosService.getAllWallets();
        res.json(wallets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/wallets/:name', async (req, res) => {
    try {
        const walletInfo = cosmosService.getWallet(req.params.name);
        if (!walletInfo) {
            return res.status(404).json({ error: '钱包不存在' });
        }

        const balance = await cosmosService.getBalance(walletInfo.address);
        res.json({
            name: req.params.name,
            address: walletInfo.address,
            balance
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/wallets/:name', (req, res) => {
    try {
        const success = cosmosService.deleteWallet(req.params.name);
        if (success) {
            io.emit('walletDeleted', req.params.name);
            res.json({ message: '钱包删除成功' });
        } else {
            res.status(404).json({ error: '钱包不存在' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Transaction endpoints
app.post('/api/transactions', async (req, res) => {
    try {
        const { fromWalletName, to, amount, memo = '' } = req.body;
        
        const result = await cosmosService.sendTokens(fromWalletName, to, amount, memo);
        
        io.emit('newTransaction', {
            from: result.from,
            to: result.to,
            amount: result.amount,
            hash: result.transactionHash,
            type: 'transfer',
            timestamp: Date.now()
        });
        
        res.json({
            message: '交易发送成功',
            transaction: result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mining endpoint (模拟，Cosmos网络不需要挖矿)
app.post('/api/mine', async (req, res) => {
    try {
        const { minerWalletName } = req.body;
        
        if (!minerWalletName) {
            return res.status(400).json({ error: '需要指定矿工钱包' });
        }

        const result = await cosmosService.simulateMining(minerWalletName);
        
        io.emit('blockMined', {
            miner: result.minerAddress,
            reward: result.reward,
            height: result.blockHeight
        });
        
        res.json({
            message: '模拟挖矿完成',
            reward: result.reward,
            height: result.blockHeight
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mint tokens endpoint (在Cosmos网络中，这个功能不适用，但保留兼容性)
app.post('/api/mint', async (req, res) => {
    res.status(400).json({ 
        error: '在Cosmos网络中无法直接铸造代币。请使用水龙头或其他方式获取测试代币。' 
    });
});

// Faucet endpoints
app.post('/api/faucet', async (req, res) => {
    try {
        const { walletName, amount = 1000 } = req.body;
        
        if (!walletName) {
            return res.status(400).json({ error: '需要指定钱包名称' });
        }

        const result = await cosmosService.faucetRequest(walletName, amount);
        
        io.emit('faucetUsed', {
            walletName,
            amount: result.amount,
            address: result.address,
            transactionHash: result.transactionHash
        });
        
        res.json({
            message: result.message,
            transaction: result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/faucet/status/:walletName', (req, res) => {
    try {
        const status = cosmosService.canUseFaucet(req.params.walletName);
        res.json(status);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reset faucet cooldown for testing
app.post('/api/faucet/reset/:walletName', (req, res) => {
    try {
        const result = cosmosService.resetFaucetCooldown(req.params.walletName);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('客户端连接:', socket.id);
    
    // 发送初始状态
    cosmosService.getBlockchainInfo().then(info => {
        cosmosService.getAllWallets().then(wallets => {
            socket.emit('blockchainState', {
                blockchain: info,
                wallets,
                blocks: [{
                    timestamp: Date.now(),
                    transactions: [],
                    hash: 'cosmos-network',
                    previousHash: ''
                }],
                pendingTransactions: []
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
    });
});

// Initialize demo data
const initializeDemo = async () => {
    console.log('初始化Cosmos服务...');
    
    try {
        // 尝试连接到Cosmos网络
        await cosmosService.connectToNetwork();
        console.log('已连接到Cosmos网络');
        
        // 创建示例钱包
        await cosmosService.createWallet('Alice');
        await cosmosService.createWallet('Bob');
        await cosmosService.createWallet('Charlie');
        
        console.log('示例钱包创建完成！');
        console.log('注意：这些是新钱包，需要通过水龙头获取测试代币');
        console.log('Cosmos Hub测试网水龙头: https://faucet.cosmos.network/');
        
    } catch (error) {
        console.error('初始化失败:', error.message);
        console.log('将在离线模式下运行，部分功能可能不可用');
    }
};

// Start server
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    initializeDemo();
});

module.exports = { app, server, cosmosService };