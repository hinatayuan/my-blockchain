// Express服务器和WebSocket相关依赖
import express, { Request, Response } from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'
import fs from 'fs'
import path from 'path'

// 区块链核心组件
import { Blockchain } from './blockchain'
import { WalletManager } from './wallet'

// 创建Express应用和HTTP服务器
const app = express()
const server = http.createServer(app)
// 配置Socket.IO用于实时通信
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // 允许前端跨域访问
    methods: ['GET', 'POST']
  }
})

// 服务器端口配置
const PORT = process.env['PORT'] || 5002

// 初始化区块链实例和钱包管理器
const myBlockchain = new Blockchain()
const walletManager = new WalletManager()

// 数据持久化文件路径配置
const DATA_DIR = path.join(__dirname, '..', 'data')
const BLOCKCHAIN_FILE = path.join(DATA_DIR, 'blockchain.json')
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

/**
 * 保存区块链数据到文件
 * 包括区块链、难度、待处理交易、挖矿奖励和余额等信息
 */
function saveBlockchainData(): void {
  try {
    const blockchainData = {
      chain: myBlockchain.chain, // 区块链主链
      difficulty: myBlockchain.difficulty, // 挖矿难度
      pendingTransactions: myBlockchain.pendingTransactions, // 待处理交易
      miningReward: myBlockchain.miningReward, // 挖矿奖励
      balances: Array.from(myBlockchain.balances.entries()) // 账户余额映射
    }
    fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchainData, null, 2))
  } catch (error) {
    console.error('Failed to save blockchain data:', error)
  }
}

/**
 * 保存钱包数据到文件
 * 包括钱包名称、私钥、公钥和地址信息
 */
function saveWalletData(): void {
  try {
    const walletData: Array<{
      name: string
      privateKey: string
      publicKey: string
      address: string
    }> = []
    // 遍历所有钱包，提取关键信息
    for (const [name, wallet] of walletManager.wallets) {
      walletData.push({
        name,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address
      })
    }
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(walletData, null, 2))
  } catch (error) {
    console.error('Failed to save wallet data:', error)
  }
}

/**
 * 从文件加载区块链数据
 * @returns 是否成功加载数据
 */
function loadBlockchainData(): boolean {
  try {
    if (fs.existsSync(BLOCKCHAIN_FILE)) {
      const data = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE, 'utf8'))

      // 重新构造Block和Transaction对象
      const { Block } = require('./block')
      const { TransactionClass } = require('./transaction')

      // 重建区块链，将JSON数据转换为类实例
      myBlockchain.chain = data.chain.map((blockData: any) => {
        const transactions = blockData.transactions.map((txData: any) => {
          return TransactionClass.fromData(txData)
        })
        const block = new Block(
          blockData.timestamp,
          transactions,
          blockData.previousHash
        )
        // 恢复区块的哈希值和nonce
        block.hash = blockData.hash
        block.nonce = blockData.nonce
        return block
      })

      // 恢复挖矿难度
      myBlockchain.difficulty = data.difficulty || 2

      // 重建待处理交易队列
      myBlockchain.pendingTransactions = (data.pendingTransactions || []).map(
        (txData: any) => {
          return TransactionClass.fromData(txData)
        }
      )

      // 恢复挖矿奖励和余额信息
      myBlockchain.miningReward = data.miningReward || 100
      if (data.balances) {
        myBlockchain.balances = new Map(data.balances)
      }
      console.log('Blockchain data loaded successfully')
      return true
    }
  } catch (error) {
    console.error('Failed to load blockchain data:', error)
  }
  return false
}

/**
 * 从文件加载钱包数据
 * 支持RSA旧格式和新的椭圆曲线格式
 * @returns 是否成功加载数据
 */
function loadWalletData(): boolean {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const data = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'))
      
      // 使用WalletManager的新方法加载钱包（支持新旧格式）
      walletManager.loadWallets(data)
      
      console.log(`Wallet data loaded successfully. Active wallets: ${walletManager.wallets.size}`)
      return walletManager.wallets.size > 0
    }
  } catch (error) {
    console.error('Failed to load wallet data:', error)
  }
  return false
}

// 中间件配置
app.use(cors()) // 允许跨域请求
app.use(express.json()) // 解析JSON格式的请求体

// ==================== 区块链 API 接口 ====================

/**
 * 获取区块链基本信息
 * GET /api/blockchain/info
 */
app.get('/api/blockchain/info', (_req: Request, res: Response) => {
  res.json(myBlockchain.getBlockchainInfo())
})

/**
 * 获取所有区块
 * GET /api/blockchain/blocks
 */
app.get('/api/blockchain/blocks', (_req: Request, res: Response) => {
  res.json(myBlockchain.chain)
})

/**
 * 根据索引获取指定区块
 * GET /api/blockchain/blocks/:index
 */
app.get('/api/blockchain/blocks/:index', (req: Request, res: Response) => {
  const index = parseInt(req.params['index'] || '0')
  const block = myBlockchain.getBlock(index)

  if (block) {
    res.json(block)
  } else {
    res.status(404).json({ error: '区块不存在' })
  }
})

/**
 * 获取所有交易记录
 * GET /api/blockchain/transactions
 */
app.get('/api/blockchain/transactions', (_req: Request, res: Response) => {
  res.json(myBlockchain.getAllTransactions())
})

/**
 * 获取待处理交易列表
 * GET /api/blockchain/pending-transactions
 */
app.get(
  '/api/blockchain/pending-transactions',
  (_req: Request, res: Response) => {
    res.json(myBlockchain.pendingTransactions)
  }
)

// ==================== 钱包 API 接口 ====================

/**
 * 创建新钱包
 * POST /api/wallets
 * 请求体: { name: string }
 */
app.post('/api/wallets', (req: Request, res: Response) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: '钱包名称不能为空' })
    }

    const wallet = walletManager.createWallet(name)
    saveWalletData()

    const walletInfo = {
      name,
      ...wallet.getPublicInfo(),
      balance: wallet.getBalance(myBlockchain)
    }

    io.emit('walletCreated', walletInfo)

    return res.json(walletInfo)
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

/**
 * 获取所有钱包列表及其余额
 * GET /api/wallets
 */
app.get('/api/wallets', (_req: Request, res: Response) => {
  const wallets = walletManager.getAllWallets()
  // 为每个钱包添加当前余额信息
  const walletsWithBalances = wallets.map((wallet) => ({
    ...wallet,
    balance: myBlockchain.getBalance(wallet.address)
  }))
  res.json(walletsWithBalances)
})

/**
 * 根据名称获取指定钱包信息
 * GET /api/wallets/:name
 */
app.get('/api/wallets/:name', (req: Request, res: Response) => {
  const walletName = req.params['name']
  if (!walletName) {
    return res.status(400).json({ error: '钱包名称不能为空' })
  }

  const wallet = walletManager.getWallet(walletName)
  if (wallet) {
    return res.json({
      name: walletName,
      ...wallet.getPublicInfo(),
      balance: wallet.getBalance(myBlockchain)
    })
  } else {
    return res.status(404).json({ error: '钱包不存在' })
  }
})

/**
 * 删除指定钱包
 * DELETE /api/wallets/:name
 */
app.delete('/api/wallets/:name', (req: Request, res: Response) => {
  const walletName = req.params['name']
  if (!walletName) {
    return res.status(400).json({ error: '钱包名称不能为空' })
  }

  const success = walletManager.deleteWallet(walletName)
  if (success) {
    saveWalletData() // 持久化数据
    io.emit('walletDeleted', walletName) // 通知所有客户端
    return res.json({ message: '钱包删除成功' })
  } else {
    return res.status(404).json({ error: '钱包不存在' })
  }
})

// ==================== 交易 API 接口 ====================

/**
 * 创建新交易
 * POST /api/transactions
 * 请求体: { fromWalletName: string, to: string, amount: number }
 */
app.post('/api/transactions', (req: Request, res: Response) => {
  try {
    const { fromWalletName, to, amount } = req.body
    const wallet = walletManager.getWallet(fromWalletName)

    if (!wallet) {
      return res.status(404).json({ error: '发送方钱包不存在' })
    }

    const transaction = wallet.sendMoney(amount, to, myBlockchain)
    saveBlockchainData()

    io.emit('newTransaction', {
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      hash: transaction.hash,
      type: transaction.type,
      timestamp: transaction.timestamp
    })

    return res.json({
      message: '交易创建成功',
      transaction: {
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        hash: transaction.hash,
        type: transaction.type
      }
    })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

// ==================== 挖矿 API 接口 ====================

/**
 * 挖矿，将待处理交易打包成区块
 * POST /api/mine
 * 请求体: { minerWalletName: string }
 */
app.post('/api/mine', (req: Request, res: Response) => {
  try {
    const { minerWalletName } = req.body

    if (!minerWalletName) {
      return res.status(400).json({ error: '需要指定矿工钱包' })
    }

    const minerWallet = walletManager.getWallet(minerWalletName)
    if (!minerWallet) {
      return res.status(404).json({ error: '矿工钱包不存在' })
    }

    myBlockchain.minePendingTransactions(minerWallet.address)
    saveBlockchainData()

    const latestBlock = myBlockchain.getLatestBlock()

    io.emit('blockMined', {
      miner: minerWallet.address,
      reward: myBlockchain.miningReward,
      height: myBlockchain.chain.length - 1,
      block: latestBlock
    })

    return res.json({
      message: '区块挖掘成功',
      reward: myBlockchain.miningReward,
      height: myBlockchain.chain.length - 1,
      block: latestBlock
    })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

// ==================== 代币水龙头 API 接口 ====================

/**
 * 代币水龙头，向指定钱包免费发放代币
 * POST /api/faucet
 * 请求体: { walletName: string, amount?: number }
 */
app.post('/api/faucet', (req: Request, res: Response) => {
  try {
    const { walletName, amount = 1000 } = req.body

    if (!walletName) {
      return res.status(400).json({ error: '需要指定钱包名称' })
    }

    const wallet = walletManager.getWallet(walletName)
    if (!wallet) {
      return res.status(404).json({ error: '钱包不存在' })
    }

    const transaction = myBlockchain.mintTokens(wallet.address, amount)
    saveBlockchainData()

    io.emit('faucetUsed', {
      walletName,
      amount,
      address: wallet.address,
      transactionHash: transaction.hash
    })

    return res.json({
      message: `成功铸造 ${amount} 代币到钱包 ${walletName}`,
      transaction: {
        to: wallet.address,
        amount,
        hash: transaction.hash,
        type: transaction.type
      }
    })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

/**
 * 代币铸造，创建新的代币
 * POST /api/mint
 * 请求体: { to?: string, amount: number, walletName?: string }
 */
app.post('/api/mint', (req: Request, res: Response) => {
  try {
    const { to, amount, walletName } = req.body
    let targetAddress = to

    // 如果提供了钱包名称，获取钱包地址
    if (walletName) {
      const wallet = walletManager.getWallet(walletName)
      if (!wallet) {
        return res.status(404).json({ error: '钱包不存在' })
      }
      targetAddress = wallet.address
    }

    if (!targetAddress) {
      return res.status(400).json({ error: '需要指定目标地址或钱包名称' })
    }

    const transaction = myBlockchain.mintTokens(targetAddress, amount)
    saveBlockchainData()

    io.emit('tokensMinted', transaction)

    return res.json({
      message: '代币铸造成功',
      transaction: {
        to: targetAddress,
        amount,
        hash: transaction.hash,
        type: transaction.type
      }
    })
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
})

// ==================== WebSocket 连接处理 ====================

/**
 * 处理新的WebSocket连接
 * 向客户端发送初始区块链状态
 */
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id)

  // 发送初始区块链状态给新连接的客户端
  socket.emit('blockchainState', {
    blockchain: myBlockchain.getBlockchainInfo(), // 区块链基本信息
    wallets: walletManager.getAllWallets().map((wallet) => ({
      ...wallet,
      balance: myBlockchain.getBalance(wallet.address) // 每个钱包包含实时余额
    })),
    blocks: myBlockchain.chain, // 所有区块
    pendingTransactions: myBlockchain.pendingTransactions // 待处理交易
  })

  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id)
  })
})

// ==================== 初始化和启动 ====================

/**
 * 初始化演示数据（如果没有现有数据）
 * 创建Alice、Bob、Charlie三个演示钱包并铸造初始代币
 */
const initializeDemo = (): void => {
  const hasBlockchainData = loadBlockchainData()
  const hasWalletData = loadWalletData()

  if (!hasBlockchainData && !hasWalletData) {
    console.log('初始化演示数据...')

    // Create some demo wallets
    const alice = walletManager.createWallet('Alice')
    const bob = walletManager.createWallet('Bob')
    const charlie = walletManager.createWallet('Charlie')

    // Mint some initial tokens
    myBlockchain.mintTokens(alice.address, 1000)
    myBlockchain.mintTokens(bob.address, 500)

    // Mine the initial block
    myBlockchain.minePendingTransactions(charlie.address)

    // Save initial data
    saveBlockchainData()
    saveWalletData()

    console.log('演示数据初始化完成！')
    console.log('Alice 地址:', alice.address)
    console.log('Bob 地址:', bob.address)
    console.log('Charlie 地址:', charlie.address)
  } else {
    console.log('从文件加载现有数据')
  }

  console.log('区块链高度:', myBlockchain.chain.length)
  console.log('待处理交易:', myBlockchain.pendingTransactions.length)
  console.log('钱包数量:', walletManager.wallets.size)
}

/**
 * 定时自动保存数据，防止数据丢失
 * 每30秒保存一次区块链和钱包数据
 */
setInterval(() => {
  saveBlockchainData()
  saveWalletData()
}, 30000) // 每30秒保存一次

/**
 * 启动HTTP服务器
 * 初始化演示数据并开始监听端口
 */
server.listen(PORT, () => {
  console.log(`本地区块链服务器运行在端口 ${PORT}`)
  initializeDemo() // 初始化演示数据
})

// 导出核心对象供外部使用
export { app, server, myBlockchain, walletManager }
