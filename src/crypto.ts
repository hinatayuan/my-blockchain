import crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
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
    });
    
    return { publicKey, privateKey };
  }

  static signTransaction(privateKey: string, data: any): string {
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(data));
    return sign.sign(privateKey, 'hex');
  }

  static verifySignature(publicKey: string, data: any, signature: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(JSON.stringify(data));
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      console.error('签名验证错误:', error);
      return false;
    }
  }

  static hash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  static generateAddress(publicKey: string): string {
    return crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 40);
  }

  static generateRandomHash(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static validateHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  }
}