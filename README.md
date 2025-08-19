# My Blockchain 🔗

一个完整的区块链实现，包含代币生产、用户管理、转账、挖矿功能，以及与CosmJS的集成。使用React前端展示区块链浏览器界面。

## 🚀 功能特性

### 核心区块链功能
- ✅ **区块链核心**: 完整的区块链实现，包含区块、交易、哈希计算
- ✅ **代币生产**: 支持代币铸造和挖矿奖励
- ✅ **用户钱包**: 创建和管理多个钱包，生成公私钥对
- ✅ **代币转账**: 安全的点对点代币转账功能
- ✅ **挖矿系统**: 工作量证明挖矿机制，可调节难度
- ✅ **区块链浏览器**: 查看区块、交易、地址信息

### CosmJS集成
- 🌌 **Cosmos网络连接**: 连接到真实的Cosmos Hub或其他Cosmos SDK链
- 💰 **余额查询**: 查看ATOM代币余额
- 💸 **代币转账**: 在Cosmos网络上发送代币
- 📊 **网络信息**: 实时查看链ID、区块高度等信息
- 🧮 **交易模拟**: 预估gas费用

### 用户界面
- 📱 **响应式设计**: 适配桌面和移动设备
- 🎯 **直观操作**: 简洁易用的界面设计
- 📊 **实时数据**: Socket.io实现实时数据更新
- 🔍 **搜索功能**: 搜索区块、交易、地址
- 📈 **数据可视化**: 统计图表和指标展示

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express**: 服务器框架
- **Socket.io**: 实时通信
- **Crypto**: 加密算法
- **CosmJS**: Cosmos区块链集成

### 前端
- **React**: 用户界面
- **Axios**: HTTP客户端
- **Socket.io Client**: 实时通信客户端

### 区块链
- **RSA加密**: 数字签名和验证
- **SHA-256**: 哈希计算
- **工作量证明**: 挖矿算法
- **UTXO模型**: 交易验证

## 📦 安装和运行

### 1. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 2. 启动应用
```bash
# 开发模式 - 同时启动前后端
npm run dev

# 或者分别启动
# 后端服务器 (端口 5000)
npm run server:dev

# 前端应用 (端口 3000)
npm run client:dev
```

### 3. 访问应用
- 前端界面: http://localhost:3000
- 后端API: http://localhost:5000

## 🎮 使用指南

### 1. Dashboard (仪表盘)
- 查看区块链整体状态
- 监控实时活动
- 查看统计数据

### 2. Wallets (钱包管理)
- 创建新钱包
- 查看钱包余额
- 铸造代币
- 删除钱包

### 3. Transactions (交易管理)
- 发送代币转账
- 选择发送和接收钱包
- 查看交易状态

### 4. Mining (挖矿)
- 选择矿工钱包
- 挖掘待处理交易
- 获得挖矿奖励

### 5. Block Explorer (区块浏览器)
- 浏览所有区块
- 搜索区块和交易
- 查看详细信息

### 6. CosmJS Integration (Cosmos集成)
- 连接到Cosmos网络
- 管理真实的ATOM代币
- 与Cosmos Hub交互

## 📋 API接口

### 区块链API
- `GET /api/blockchain/info` - 获取区块链信息
- `GET /api/blockchain/blocks` - 获取所有区块
- `GET /api/blockchain/blocks/:index` - 获取特定区块
- `GET /api/blockchain/transactions` - 获取所有交易

### 钱包API
- `POST /api/wallets` - 创建钱包
- `GET /api/wallets` - 获取所有钱包
- `GET /api/wallets/:name` - 获取特定钱包
- `DELETE /api/wallets/:name` - 删除钱包

### 交易API
- `POST /api/transactions` - 创建交易
- `POST /api/mint` - 铸造代币
- `POST /api/mine` - 挖矿

### CosmJS API
- `POST /api/cosmjs/connect` - 连接Cosmos网络
- `GET /api/cosmjs/balance` - 获取余额
- `POST /api/cosmjs/send` - 发送代币
- `GET /api/cosmjs/network-info` - 获取网络信息

## 🔧 配置选项

### 区块链配置
- **挖矿难度**: 默认为2，可在blockchain.js中修改
- **挖矿奖励**: 默认为100代币
- **区块时间**: 根据难度自动调整

### 网络配置
- **前端端口**: 3000 (可在package.json中修改)
- **后端端口**: 5000 (可在src/server.js中修改)
- **CosmJS RPC**: 支持各种Cosmos网络

## 📚 学习资源

### 区块链概念
- **区块**: 包含交易的数据结构
- **哈希**: 用于区块验证的数字指纹
- **挖矿**: 工作量证明共识机制
- **数字签名**: 交易安全验证

### Cosmos生态
- **CosmJS文档**: https://cosmos.github.io/cosmjs/
- **Cosmos Hub**: https://hub.cosmos.network/
- **Cosmos SDK**: https://docs.cosmos.network/

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 🎯 未来计划

- [ ] 智能合约支持
- [ ] 多链连接
- [ ] 移动端应用
- [ ] 更多共识算法
- [ ] NFT支持
- [ ] DeFi功能集成

## 🆘 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用进程
   lsof -i :3000
   lsof -i :5000
   
   # 终止进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   
   # 删除node_modules重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **CosmJS连接失败**
   - 检查网络连接
   - 验证RPC端点
   - 确认助记词格式

## 📞 支持

如有问题或建议，请：
- 创建 GitHub Issue
- 发送邮件联系
- 查看文档和FAQ

---

**Happy Blockchain Building! 🚀**