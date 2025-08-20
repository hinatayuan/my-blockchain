// Node.js内置加密模块和椭圆曲线加密库
import * as crypto from 'crypto'
import * as secp256k1 from '@noble/secp256k1'

// 为@noble/secp256k1 2.x版本设置HMAC依赖
// 这是库要求的配置，用于椭圆曲线签名算法
; (secp256k1 as any).etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const hmac = crypto.createHmac('sha256', key)
  for (const message of messages) {
    hmac.update(message)
  }
  return hmac.digest()
}

// 密钥对接口，存储公钥和私钥
export interface KeyPair {
  publicKey: string // 十六进制格式的公钥
  privateKey: string // 十六进制格式的私钥
}

// 交易数据接口，用于加密签名
export interface TransactionData {
  id: string // 交易唯一标识符
  from: string | null // 发送者地址
  to: string // 接收者地址
  amount: number // 交易金额
  type: string // 交易类型
  timestamp: number // 时间戳
}

/**
 * 加密工具类，提供区块链所需的各种加密功能
 * 使用secp256k1椭圆曲线算法，与比特币和以太坊兼容
 */
export class CryptoUtils {
  /**
   * 生成椭圆曲线密钥对 (secp256k1)
   * 使用与比特币和以太坊相同的椭圆曲线算法
   * @returns 包含公钥和私钥的密钥对（十六进制格式）
   */
  static generateKeyPair(): KeyPair {
    // 生成32字节（256位）随机私钥
    const privateKeyBytes = crypto.randomBytes(32)
    const privateKey = privateKeyBytes.toString('hex')
    
    // 从私钥生成对应的公钥（33字节压缩格式）
    const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)
    const publicKey = Buffer.from(publicKeyBytes).toString('hex')
    
    return { publicKey, privateKey }
  }

  /**
   * 使用ECDSA签名交易数据
   * @param privateKey 十六进制私钥
   * @param data 交易数据
   * @returns 十六进制签名
   */
  static signTransaction(privateKey: string, data: TransactionData): string {
    try {
      // 将交易数据转换为哈希
      const messageHash = CryptoUtils.hash(data)
      
      // 使用私钥签名哈希
      const signature = secp256k1.sign(messageHash, privateKey)
      
      // 返回压缩格式的签名（64字节）
      return signature.toCompactHex()
    } catch (error) {
      console.error('Transaction signing failed:', error)
      throw new Error('Failed to sign transaction')
    }
  }

  /**
   * 验证ECDSA签名
   * @param publicKey 十六进制公钥
   * @param data 交易数据
   * @param signature 十六进制签名
   * @returns 验证结果
   */
  static verifySignature(
    publicKey: string,
    data: TransactionData,
    signature: string
  ): boolean {
    try {
      // 将交易数据转换为哈希
      const messageHash = CryptoUtils.hash(data)
      
      // 验证签名
      return secp256k1.verify(signature, messageHash, publicKey)
    } catch (error) {
      console.error('Signature verification failed:', error)
      return false
    }
  }

  /**
   * 计算数据的SHA256哈希
   * @param data 要哈希的数据
   * @returns 十六进制哈希值
   */
  static hash(data: unknown): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
  }

  /**
   * 从公钥生成区块链地址
   * 使用类似以太坊的方式：Keccak256(公钥)的后20字节
   * 这里简化为SHA256的后20字节 (40位十六进制)
   * @param publicKey 十六进制公钥
   * @returns 40位十六进制地址
   */
  static generateAddress(publicKey: string): string {
    // 如果是压缩公钥(33字节)，先解压缩为完整公钥(65字节)
    let fullPublicKey: string
    
    try {
      const pubKeyBytes = Buffer.from(publicKey, 'hex')
      if (pubKeyBytes.length === 33) {
        // 压缩公钥，解压缩
        const uncompressed = secp256k1.Point.fromHex(publicKey).toRawBytes(false)
        fullPublicKey = Buffer.from(uncompressed.slice(1)).toString('hex') // 去掉0x04前缀
      } else if (pubKeyBytes.length === 65) {
        // 已经是未压缩公钥，去掉0x04前缀
        fullPublicKey = publicKey.substring(2)
      } else {
        // 可能是64字节未压缩公钥（已去掉0x04前缀）
        fullPublicKey = publicKey
      }
      
      // 计算地址：SHA256哈希的后20字节
      return crypto
        .createHash('sha256')
        .update(Buffer.from(fullPublicKey, 'hex'))
        .digest('hex')
        .substring(24) // 取后20字节 (40位十六进制)
    } catch (error) {
      console.error('Address generation failed:', error)
      // 回退到简单的SHA256方案
      return crypto
        .createHash('sha256')
        .update(publicKey)
        .digest('hex')
        .substring(0, 40)
    }
  }

  /**
   * 验证私钥格式是否有效
   * @param privateKey 十六进制私钥
   * @returns 是否有效
   */
  static isValidPrivateKey(privateKey: string): boolean {
    try {
      // 检查长度和格式
      if (privateKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(privateKey)) {
        return false
      }
      
      // 尝试生成公钥验证私钥有效性
      secp256k1.getPublicKey(privateKey, true)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证公钥格式是否有效
   * @param publicKey 十六进制公钥
   * @returns 是否有效
   */
  static isValidPublicKey(publicKey: string): boolean {
    try {
      const pubKeyBytes = Buffer.from(publicKey, 'hex')
      
      // 检查长度：33字节压缩或65字节未压缩
      if (pubKeyBytes.length !== 33 && pubKeyBytes.length !== 65) {
        return false
      }
      
      // 尝试解析公钥验证有效性
      secp256k1.Point.fromHex(publicKey)
      return true
    } catch {
      return false
    }
  }
}
