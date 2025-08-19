const crypto = require('crypto');

class CryptoUtils {
    static generateKeyPair() {
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

    static signTransaction(privateKey, data) {
        const sign = crypto.createSign('SHA256');
        sign.update(JSON.stringify(data));
        return sign.sign(privateKey, 'hex');
    }

    static verifySignature(publicKey, data, signature) {
        const verify = crypto.createVerify('SHA256');
        verify.update(JSON.stringify(data));
        return verify.verify(publicKey, signature, 'hex');
    }

    static hash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    static generateAddress(publicKey) {
        return crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 40);
    }
}

module.exports = CryptoUtils;