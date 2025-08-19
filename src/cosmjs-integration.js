const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningStargateClient, GasPrice } = require('@cosmjs/stargate');
const { coins } = require('@cosmjs/amino');

class CosmJSIntegration {
    constructor() {
        this.client = null;
        this.wallet = null;
        this.address = null;
    }

    async connectToNetwork(rpcEndpoint = 'https://rpc.cosmos.directory/cosmoshub', mnemonic = null) {
        try {
            // Create or restore wallet
            if (mnemonic) {
                this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                    prefix: 'cosmos'
                });
            } else {
                this.wallet = await DirectSecp256k1HdWallet.generate(12, {
                    prefix: 'cosmos'
                });
            }

            // Get wallet address
            const [firstAccount] = await this.wallet.getAccounts();
            this.address = firstAccount.address;

            // Connect to the network
            this.client = await SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                this.wallet,
                {
                    gasPrice: GasPrice.fromString('0.025uatom')
                }
            );

            return {
                address: this.address,
                mnemonic: this.wallet.mnemonic,
                connected: true
            };
        } catch (error) {
            console.error('Failed to connect to Cosmos network:', error);
            throw error;
        }
    }

    async getBalance(address = null) {
        if (!this.client) {
            throw new Error('Not connected to network');
        }

        const targetAddress = address || this.address;
        try {
            const balance = await this.client.getBalance(targetAddress, 'uatom');
            return balance;
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    async sendTokens(recipientAddress, amount, denom = 'uatom', memo = '') {
        if (!this.client || !this.wallet) {
            throw new Error('Not connected to network');
        }

        try {
            const sendAmount = coins(amount, denom);
            const result = await this.client.sendTokens(
                this.address,
                recipientAddress,
                sendAmount,
                'auto',
                memo
            );

            return {
                transactionHash: result.transactionHash,
                height: result.height,
                gasUsed: result.gasUsed,
                success: result.code === 0
            };
        } catch (error) {
            console.error('Failed to send tokens:', error);
            throw error;
        }
    }

    async getTransactionHistory(address = null) {
        if (!this.client) {
            throw new Error('Not connected to network');
        }

        const targetAddress = address || this.address;
        try {
            // This is a simplified version - in practice you'd need to query 
            // transaction history from an indexer or node
            const account = await this.client.getAccount(targetAddress);
            return {
                address: targetAddress,
                accountNumber: account?.accountNumber,
                sequence: account?.sequence
            };
        } catch (error) {
            console.error('Failed to get transaction history:', error);
            throw error;
        }
    }

    async getNetworkInfo() {
        if (!this.client) {
            throw new Error('Not connected to network');
        }

        try {
            const height = await this.client.getHeight();
            const chainId = await this.client.getChainId();
            
            return {
                height,
                chainId,
                connected: true
            };
        } catch (error) {
            console.error('Failed to get network info:', error);
            throw error;
        }
    }

    async simulateTransaction(recipientAddress, amount, denom = 'uatom') {
        if (!this.client) {
            throw new Error('Not connected to network');
        }

        try {
            const sendAmount = coins(amount, denom);
            const simulation = await this.client.simulate(
                this.address,
                [{
                    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                    value: {
                        fromAddress: this.address,
                        toAddress: recipientAddress,
                        amount: sendAmount
                    }
                }],
                ''
            );

            return {
                gasUsed: simulation,
                estimatedFee: Math.ceil(simulation * 1.3) // Add 30% buffer
            };
        } catch (error) {
            console.error('Failed to simulate transaction:', error);
            throw error;
        }
    }

    generateNewWallet() {
        return DirectSecp256k1HdWallet.generate(12, { prefix: 'cosmos' });
    }

    disconnect() {
        this.client = null;
        this.wallet = null;
        this.address = null;
    }

    isConnected() {
        return this.client !== null && this.wallet !== null;
    }

    getConnectionInfo() {
        return {
            connected: this.isConnected(),
            address: this.address,
            hasWallet: this.wallet !== null
        };
    }
}

module.exports = CosmJSIntegration;