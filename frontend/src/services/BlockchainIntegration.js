// src/services/BlockchainService.js
import Web3 from 'web3';

// Contract address from your config
const CONTRACT_ADDRESS = "0x7A950d2311E19e14F4a7A0A980dC1e24eA7bf0E0";

// Full ABI inline
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "documentType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "documentHash",
        "type": "string"
      }
    ],
    "name": "DocumentUploaded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "docIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "status",
        "type": "string"
      }
    ],
    "name": "DocumentVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      }
    ],
    "name": "VerifierAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      }
    ],
    "name": "VerifierRemoved",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "name": "addVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "getDocument",
    "outputs": [
      {
        "internalType": "string",
        "name": "documentHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "documentType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "status",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "notes",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getDocumentCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_addr",
        "type": "address"
      }
    ],
    "name": "isVerifier",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "name": "removeVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_documentHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_documentType",
        "type": "string"
      }
    ],
    "name": "uploadDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_docIndex",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_status",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_notes",
        "type": "string"
      }
    ],
    "name": "verifyDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "verifiers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.initialized = false;
    this.isConnecting = false;
    this.contractAddress = CONTRACT_ADDRESS;
  }

  /**
   * Check if contract exists and is accessible
   * @returns {Promise<boolean>} - Whether contract exists and is accessible
   */
  async checkContract() {
    if (!this.web3) {
      this.web3 = new Web3(window.ethereum || "http://localhost:8545");
    }
    
    try {
      // Check if there's code at the address
      const code = await this.web3.eth.getCode(this.contractAddress);
      if (code === '0x' || code === '0x0') {
        throw new Error(`No contract found at address ${this.contractAddress}`);
      }
    } catch (error) {
      console.error("Error checking contract code:", error);
      throw new Error("Failed to check if contract exists: " + error.message);
    }
    
    // Try to get contract owner
    try {
      // If we already have a contract instance, use it
      if (this.contract) {
        const owner = await this.contract.methods.owner().call();
        console.log("Contract owner:", owner);
      } else {
        // Otherwise create a minimal contract just to check the owner method
        const ownerContract = new this.web3.eth.Contract([
          {
            "inputs": [],
            "name": "owner",
            "outputs": [
              {
                "internalType": "address",
                "name": "",
                "type": "address"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ], this.contractAddress);
        
        const owner = await ownerContract.methods.owner().call();
        console.log("Contract owner:", owner);
      }
      
      return true;
    } catch (error) {
      console.warn("Contract owner check failed:", error);
      // We'll still return true as long as the contract code check passed
      return true;
    }
  }

  /**
   * Initialize blockchain connection
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async init() {
    if (this.initialized) return true;
    if (this.isConnecting) return false;

    this.isConnecting = true;
    
    try {
      // Check if Web3 is injected by MetaMask
      if (window.ethereum) {
        this.web3 = new Web3(window.ethereum);
      } else if (window.web3) {
        // Legacy dapp browsers
        this.web3 = new Web3(window.web3.currentProvider);
      } else {
        // Fallback to local provider (development only)
        this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      }

      try {
        // Initialize contract first
        if (!Array.isArray(CONTRACT_ABI)) {
          throw new Error("CONTRACT_ABI format is invalid");
        }
        
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, this.contractAddress);
        
        // Then check if contract exists
        await this.checkContract();
      } catch (contractError) {
        console.error("Contract initialization error:", contractError);
        throw new Error("Failed to initialize contract: " + contractError.message);
      }
      
      this.initialized = true;
      this.isConnecting = false;
      
      console.log("Blockchain service initialized successfully");
      return true;
    } catch (error) {
      console.error("Blockchain initialization error:", error);
      this.initialized = false;
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Connect wallet
   * @returns {Promise<string>} - Wallet address
   */
  async connectWallet() {
    try {
      await this.init();
      
      if (!window.ethereum) {
        throw new Error("MetaMask not installed. Please install to use this feature.");
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        console.log("Wallet connected:", this.account);
        return this.account;
      } else {
        throw new Error("No accounts returned from wallet");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      throw error;
    }
  }

  /**
   * Upload document to blockchain
   * @param {string} ipfsHash - IPFS hash of document
   * @param {string} documentType - Type of document
   * @returns {Promise<object>} - Transaction receipt
   */
  async uploadDocument(ipfsHash, documentType) {
    try {
      if (!this.account) {
        await this.connectWallet();
      }
      
      console.log("Uploading document to blockchain");
      console.log("IPFS Hash:", ipfsHash);
      console.log("Document Type:", documentType);
      
      // Real blockchain transaction
      const tx = await this.contract.methods.uploadDocument(ipfsHash, documentType).send({
        from: this.account
      });
      
      console.log("Document uploaded successfully:", tx.transactionHash);
      return tx;
    } catch (error) {
      console.error("Document upload error:", error);
      throw error;
    }
  }

  /**
   * Verify document on blockchain
   * @param {string} userAddress - User's wallet address
   * @param {number} documentIndex - Document index
   * @param {string} status - Verification status
   * @param {string} notes - Verification notes
   * @returns {Promise<object>} - Transaction receipt
   */
  async verifyDocument(userAddress, documentIndex, status, notes) {
    try {
      if (!this.account) {
        await this.connectWallet();
      }
      
      console.log("Verifying document on blockchain");
      console.log("User Address:", userAddress);
      console.log("Document Index:", documentIndex);
      console.log("Status:", status);
      console.log("Notes:", notes);
      
      // Real blockchain transaction
      const tx = await this.contract.methods.verifyDocument(userAddress, documentIndex, status, notes).send({
        from: this.account
      });
      
      console.log("Document verified successfully:", tx.transactionHash);
      return tx;
    } catch (error) {
      console.error("Document verification error:", error);
      throw error;
    }
  }

  /**
   * Get document from blockchain
   * @param {string} userAddress - User's wallet address
   * @param {number} documentIndex - Document index
   * @returns {Promise<object>} - Document details
   */
  async getDocument(userAddress, documentIndex) {
    try {
      await this.init();
      
      console.log("Getting document from blockchain");
      console.log("User Address:", userAddress);
      console.log("Document Index:", documentIndex);
      
      // Real blockchain call
      const document = await this.contract.methods.getDocument(userAddress, documentIndex).call();
      console.log("Document retrieved:", document);
      return document;
    } catch (error) {
      console.error("Get document error:", error);
      throw error;
    }
  }

  /**
   * Get document count for a user
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<number>} - Document count
   */
  async getDocumentCount(userAddress) {
    try {
      await this.init();
      
      console.log("Getting document count from blockchain");
      console.log("User Address:", userAddress);
      
      // Real blockchain call
      const count = await this.contract.methods.getDocumentCount(userAddress).call();
      console.log("Document count:", count);
      return count;
    } catch (error) {
      console.error("Get document count error:", error);
      throw error;
    }
  }

  /**
   * Check if an address is a verifier
   * @param {string} address - Address to check
   * @returns {Promise<boolean>} - Whether address is a verifier
   */
  async isVerifier(address) {
    try {
      await this.init();
      
      console.log("Checking if address is verifier");
      console.log("Address:", address);
      
      // Real blockchain call
      const isVerifier = await this.contract.methods.isVerifier(address).call();
      console.log("Is verifier:", isVerifier);
      return isVerifier;
    } catch (error) {
      console.error("Is verifier check error:", error);
      throw error;
    }
  }

  /**
   * Get network information
   * @returns {Promise<object>} - Network information
   */
  async getNetworkInfo() {
    try {
      await this.init();
      
      console.log("Getting network information");
      
      // Get network ID
      const networkId = await this.web3.eth.net.getId();
      
      // Get latest block number
      const latestBlock = await this.web3.eth.getBlockNumber();
      
      // Get gas price
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');
      
      // Get peer count
      const peerCount = await this.web3.eth.net.getPeerCount();
      
      const info = {
        networkId,
        gasPrice: gasPriceGwei,
        latestBlock,
        peerCount,
        connected: true
      };
      
      console.log("Network info:", info);
      return info;
    } catch (error) {
      console.error("Get network info error:", error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get the user's blockchain wallet address
   * @returns {Promise<string>} - Wallet address
   */
  async getWalletAddress() {
    if (this.account) return this.account;
    
    return await this.connectWallet();
  }
}

// Create a singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;