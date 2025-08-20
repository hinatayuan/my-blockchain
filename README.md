# My Blockchain 🔗

一个完整的区块链实现，使用TypeScript和React构建，包含代币生产、用户管理、转账、挖矿功能。采用椭圆曲线密码学(secp256k1)提供安全保障，React前端提供直观的区块链浏览器界面。

## 🚀 功能特性

### 核心区块链功能
- ✅ **区块链核心**: 完整的区块链实现，包含区块、交易、哈希计算
- ✅ **椭圆曲线加密**: 使用secp256k1算法，与比特币、以太坊兼容
- ✅ **代币系统**: 支持代币铸造、转账和挖矿奖励
- ✅ **钱包管理**: 创建和管理多个钱包，生成椭圆曲线密钥对
- ✅ **安全转账**: 基于数字签名的点对点代币转账
- ✅ **挖矿系统**: 工作量证明(PoW)挖矿机制，可调节难度
- ✅ **数据持久化**: 自动保存区块链和钱包数据

### 用户界面
- 📱 **响应式设计**: 适配桌面和移动设备
- 🎯 **直观操作**: 简洁易用的多标签页界面
- 📊 **实时数据**: WebSocket实现实时数据更新
- 🔍 **区块浏览器**: 完整的区块和交易浏览功能
- 📈 **数据可视化**: 统计图表和系统状态监控
- 🔔 **实时通知**: 系统事件实时提醒

## 🛠️ 技术栈

### 后端 (TypeScript)
- **Node.js** + **Express**: RESTful API服务器
- **Socket.io**: WebSocket实时通信
- **@noble/secp256k1**: 椭圆曲线密码学库
- **TypeScript**: 类型安全的JavaScript
- **UUID**: 交易唯一标识符生成

### 前端 (React + TypeScript)
- **React 18**: 现代化用户界面
- **TypeScript**: 类型安全的前端开发
- **Axios**: HTTP客户端
- **Socket.io Client**: 实时通信客户端

### 密码学和安全
- **secp256k1椭圆曲线**: 与比特币/以太坊兼容的密码学算法
- **ECDSA数字签名**: 交易安全验证
- **SHA-256哈希**: 区块和交易哈希计算
- **工作量证明**: 挖矿共识机制

## 📦 安装和运行

### 环境要求
- Node.js 16+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd my-blockchain
```

### 2. 安装依赖
```bash
# 安装根目录依赖（后端）
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 3. 启动应用
```bash
# 开发模式 - 同时启动前后端
npm run dev

# 或者分别启动
# 后端服务器 (端口 5002)
npm run server:dev

# 前端应用 (端口 3000)
npm run client:dev
```

### 4. 访问应用
- 前端界面: http://localhost:3000
- 后端API: http://localhost:5002

## 🎮 使用指南

### 1. 仪表盘 (Dashboard) 📊
- 查看区块链整体状态和关键指标
- 实时监控系统活动和统计数据
- 显示区块链高度、代币总量、挖矿难度等信息
- 查看最近的交易活动和钱包概览

### 2. 钱包管理 (Wallets) 👛
- **创建钱包**: 生成新的椭圆曲线密钥对和钱包地址
- **查看余额**: 实时查看每个钱包的代币余额
- **代币水龙头**: 免费获取测试代币
- **删除钱包**: 安全删除不需要的钱包

### 3. 交易管理 (Transactions) 💸
- **发送代币**: 在钱包间进行安全的代币转账
- **选择钱包**: 从下拉列表选择发送方和接收方
- **交易签名**: 使用椭圆曲线数字签名验证交易
- **实时状态**: 查看交易处理状态和历史

### 4. 挖矿 (Mining) ⛏️
- **选择矿工**: 指定获得挖矿奖励的钱包
- **挖掘区块**: 将待处理交易打包成新区块
- **获得奖励**: 成功挖矿后自动获得代币奖励
- **难度调节**: 系统根据需要调整挖矿难度

### 5. 区块浏览器 (Explorer) 🔍
- **浏览区块**: 查看所有区块的详细信息
- **交易记录**: 查看每个区块中包含的交易
- **搜索功能**: 搜索特定的区块或交易
- **数据统计**: 查看区块链的各项统计数据

## 📋 API接口文档

### 区块链相关接口
- `GET /api/blockchain/info` - 获取区块链基本信息
- `GET /api/blockchain/blocks` - 获取所有区块
- `GET /api/blockchain/blocks/:index` - 获取指定索引的区块
- `GET /api/blockchain/transactions` - 获取所有交易记录
- `GET /api/blockchain/pending-transactions` - 获取待处理交易

### 钱包管理接口
- `POST /api/wallets` - 创建新钱包
- `GET /api/wallets` - 获取所有钱包及余额
- `GET /api/wallets/:name` - 获取指定钱包信息
- `DELETE /api/wallets/:name` - 删除指定钱包

### 交易相关接口
- `POST /api/transactions` - 创建新交易
- `POST /api/mine` - 开始挖矿操作
- `POST /api/faucet` - 使用代币水龙头
- `POST /api/mint` - 铸造新代币

### WebSocket事件
- `blockchainState` - 初始区块链状态数据
- `newTransaction` - 新交易创建通知
- `blockMined` - 新区块挖出通知
- `tokensMinted` - 代币铸造通知
- `walletCreated` - 钱包创建通知
- `walletDeleted` - 钱包删除通知

## 🔧 配置选项

### 区块链配置
- **挖矿难度**: 默认为2，影响挖矿所需时间
- **挖矿奖励**: 默认为100代币，矿工成功挖矿的奖励
- **自动保存**: 每30秒自动保存区块链和钱包数据

### 网络配置
- **前端端口**: 3000 (React开发服务器)
- **后端端口**: 5002 (Express API服务器)
- **WebSocket**: 实时双向通信
- **数据存储**: 本地JSON文件持久化

## 📁 项目结构

```
my-blockchain/
├── server/                 # 后端源码 (TypeScript)
│   ├── server.ts          # Express服务器主文件
│   ├── blockchain.ts      # 区块链核心逻辑
│   ├── block.ts           # 区块实现
│   ├── transaction.ts     # 交易处理
│   ├── crypto.ts          # 椭圆曲线加密工具
│   └── wallet.ts          # 钱包管理
├── client/                # 前端源码 (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx        # 主应用组件
│   │   ├── components/    # React组件
│   │   │   ├── Dashboard.tsx
│   │   │   ├── WalletManager.tsx
│   │   │   ├── TransactionManager.tsx
│   │   │   ├── MiningPanel.tsx
│   │   │   └── BlockchainExplorer.tsx
│   │   └── hooks/         # 自定义React Hooks
│   │       └── useAutoRefresh.ts
├── data/                  # 数据持久化文件
│   ├── blockchain.json    # 区块链数据
│   └── wallets.json       # 钱包数据
└── package.json           # 依赖配置
```

## 🔐 安全特性

### 密码学安全
- **secp256k1椭圆曲线**: 与比特币相同的加密算法
- **ECDSA签名**: 每笔交易都有数字签名验证
- **私钥安全**: 私钥仅存储在本地，不传输到服务器
- **地址生成**: 从公钥安全生成钱包地址

### 系统安全
- **交易验证**: 多层交易有效性检查
- **余额验证**: 防止双重支付和余额不足
- **类型安全**: TypeScript提供编译时类型检查
- **错误处理**: 完善的错误捕获和处理机制

## 🎯 学习价值

这个项目非常适合学习以下概念：

### 区块链基础
- **区块结构**: 理解区块如何存储交易数据
- **哈希链接**: 区块间如何通过哈希连接形成链
- **工作量证明**: 了解挖矿和共识机制
- **数字签名**: 学习如何验证交易真实性

### 现代开发技术
- **TypeScript**: 类型安全的JavaScript开发
- **React Hooks**: 现代React状态管理
- **WebSocket**: 实时双向通信
- **椭圆曲线密码学**: 现代加密技术应用

## 🚀 扩展建议

### 功能扩展
- [ ] 多重签名钱包支持
- [ ] 智能合约虚拟机
- [ ] P2P网络通信
- [ ] 更多共识算法(PoS, DPoS)
- [ ] NFT功能支持
- [ ] 交易池优化

### 技术升级
- [ ] 数据库持久化(PostgreSQL/MongoDB)
- [ ] Docker容器化部署
- [ ] 单元测试覆盖
- [ ] 性能监控和日志
- [ ] API限流和安全中间件

## 🆘 故障排除

### 常见问题

1. **端口占用错误**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :5002
   
   # 终止占用进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 清理npm缓存
   npm cache clean --force
   
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript编译错误**
   ```bash
   # 检查TypeScript版本
   npx tsc --version
   
   # 重新编译
   npm run build:server
   ```

4. **数据文件损坏**
   ```bash
   # 备份并重置数据
   mv data data_backup
   mkdir data
   # 重启应用将自动创建演示数据
   ```

## 📚 相关资源

### 学习资料
- [椭圆曲线密码学详解](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)
- [secp256k1曲线](https://en.bitcoin.it/wiki/Secp256k1)
- [工作量证明算法](https://en.wikipedia.org/wiki/Proof_of_work)
- [数字签名原理](https://en.wikipedia.org/wiki/Digital_signature)

### 技术文档
- [Node.js官方文档](https://nodejs.org/docs/)
- [React官方文档](https://reactjs.org/docs/)
- [TypeScript手册](https://www.typescriptlang.org/docs/)
- [Express.js指南](https://expressjs.com/guide/)

## 🤝 贡献指南

1. Fork 项目到你的GitHub账户
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持与反馈

如果你在使用过程中遇到问题或有改进建议：

- 📧 创建 GitHub Issue
- 💬 参与项目讨论
- 🐛 报告Bug或安全问题
- ⭐ 如果项目对你有帮助，请给个Star!

---

**Happy Blockchain Learning! 🚀 区块链学习快乐！**