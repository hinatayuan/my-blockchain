import * as crypto from 'crypto'

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export interface TransactionData {
  id: string
  from: string | null
  to: string
  amount: number
  type: string
  timestamp: number
}

export class CryptoUtils {
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    return { publicKey, privateKey }
  }

  static signTransaction(privateKey: string, data: TransactionData): string {
    const sign = crypto.createSign('SHA256')
    sign.update(JSON.stringify(data))
    return sign.sign(privateKey, 'hex')
  }

  static verifySignature(
    publicKey: string,
    data: TransactionData,
    signature: string
  ): boolean {
    const verify = crypto.createVerify('SHA256')
    verify.update(JSON.stringify(data))
    return verify.verify(publicKey, signature, 'hex')
  }

  static hash(data: unknown): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
  }

  static generateAddress(publicKey: string): string {
    return crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 40)
  }
}
