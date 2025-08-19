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

const PORT = process.env.PORT || 5001;

// Initialize Cosmos service
const cosmosService = new CosmosService();

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
        res.status(404).json({ error: 'Block not found' });
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
        const { name } = req.body;
        const wallet = walletManager.createWallet(name);
        res.json({
            name,
            ...wallet.getPublicInfo()
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
        res.status(404).json({ error: 'Wallet not found' });
    }
});

app.delete('/api/wallets/:name', (req, res) => {
    const success = walletManager.deleteWallet(req.params.name);
    if (success) {
        res.json({ message: 'Wallet deleted successfully' });
    } else {
        res.status(404).json({ error: 'Wallet not found' });
    }
});

// Transaction endpoints
app.post('/api/transactions', (req, res) => {
    try {
        const { from, to, amount, walletName } = req.body;
        const wallet = walletManager.getWallet(walletName);
        
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const transaction = wallet.sendMoney(amount, to, myBlockchain);
        
        io.emit('newTransaction', transaction);
        
        res.json({
            message: 'Transaction created successfully',
            transaction
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mining endpoints
app.post('/api/mine', (req, res) => {
    try {
        const { minerAddress } = req.body;
        
        if (!minerAddress) {
            return res.status(400).json({ error: 'Miner address is required' });
        }

        myBlockchain.minePendingTransactions(minerAddress);
        
        const latestBlock = myBlockchain.getLatestBlock();
        
        io.emit('blockMined', latestBlock);
        
        res.json({
            message: 'Block mined successfully',
            block: latestBlock,
            reward: myBlockchain.miningReward
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Token minting endpoints
app.post('/api/mint', (req, res) => {
    try {
        const { to, amount } = req.body;
        
        const transaction = myBlockchain.mintTokens(to, amount);
        
        io.emit('tokensMinted', transaction);
        
        res.json({
            message: 'Tokens minted successfully',
            transaction
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// CosmJS endpoints
app.post('/api/cosmjs/connect', async (req, res) => {
    try {
        const { rpcEndpoint, mnemonic } = req.body;
        const result = await cosmjsClient.connectToNetwork(rpcEndpoint, mnemonic);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/cosmjs/info', (req, res) => {
    res.json(cosmjsClient.getConnectionInfo());
});

app.get('/api/cosmjs/balance/:address?', async (req, res) => {
    try {
        const address = req.params.address;
        const balance = await cosmjsClient.getBalance(address);
        res.json(balance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/cosmjs/send', async (req, res) => {
    try {
        const { to, amount, denom, memo } = req.body;
        const result = await cosmjsClient.sendTokens(to, amount, denom, memo);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/cosmjs/network-info', async (req, res) => {
    try {
        const info = await cosmjsClient.getNetworkInfo();
        res.json(info);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/cosmjs/simulate', async (req, res) => {
    try {
        const { to, amount, denom } = req.body;
        const simulation = await cosmjsClient.simulateTransaction(to, amount, denom);
        res.json(simulation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/cosmjs/disconnect', (req, res) => {
    cosmjsClient.disconnect();
    res.json({ message: 'Disconnected from Cosmos network' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial blockchain state
    socket.emit('blockchainState', {
        blockchain: myBlockchain.getBlockchainInfo(),
        blocks: myBlockchain.chain,
        pendingTransactions: myBlockchain.pendingTransactions
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Initialize with some demo data
const initializeDemo = () => {
    console.log('Initializing demo data...');
    
    // Create some demo wallets
    const alice = walletManager.createWallet('Alice');
    const bob = walletManager.createWallet('Bob');
    const charlie = walletManager.createWallet('Charlie');
    
    // Mint some initial tokens
    myBlockchain.mintTokens(alice.address, 1000);
    myBlockchain.mintTokens(bob.address, 500);
    
    // Mine the initial block
    myBlockchain.minePendingTransactions(charlie.address);
    
    console.log('Demo data initialized!');
    console.log('Alice address:', alice.address);
    console.log('Bob address:', bob.address);
    console.log('Charlie address:', charlie.address);
};

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initializeDemo();
});

module.exports = { app, server, myBlockchain, walletManager, cosmjsClient };