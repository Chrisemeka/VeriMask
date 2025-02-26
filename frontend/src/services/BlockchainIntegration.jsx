// frontend/src/services/BlockchainIntegration.js
import Web3 from 'web3';

// Hard-code the ABI instead of importing it
const ContractABI = [
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
    // Initialize connection to the blockchain
    this.web3Provider = window.ethereum || "http://localhost:8545";
    this.web3 = new Web3(this.web3Provider);
    
    // Update with your deployed contract address
    this.contractAddress = "0xF75514320875B74CE51e0756a7A8a62F0f74DC06DF"; // Make sure this matches your deployed contract
    this.contract = null;
    this.account = null;
    
    // Initialize contract
    this.initContract();
  }
  
  async initContract() {
    try {
      console.log("Initializing contract at address:", this.contractAddress);
      // Create contract instance using the hardcoded ABI
      this.contract = new this.web3.eth.Contract(
        ContractABI,
        this.contractAddress
      );
      
      console.log("Contract object:", this.contract);
      // Test a simple call to verify the contract is working
      try {
        const owner = await this.contract.methods.owner().call();
        console.log("Contract owner:", owner);
      } catch (callErr) {
        console.error("Error calling contract method:", callErr);
      }
      
      console.log("Contract initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      return false;
    }
  }
  
  async connectWallet() {
    // Check if MetaMask is installed
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get the first account
        this.account = accounts[0];
        console.log("Connected to wallet:", this.account);
        return this.account;
      } catch (error) {
        console.error("User denied account access");
        throw new Error("User denied account access");
      }
    } else {
      throw new Error("MetaMask is not installed. Please install it to use this application.");
    }
  }
  
  async uploadDocument(documentHash, documentType) {
    try {
      // Ensure wallet is connected
      if (!this.account) {
        await this.connectWallet();
      }
      
      // Ensure contract is initialized
      if (!this.contract) {
        await this.initContract();
      }
      
      // Check if contract is still null after initialization attempt
      if (!this.contract) {
        throw new Error("Contract initialization failed. Please check your connection and contract address.");
      }
      
      console.log("Uploading document to blockchain:", { documentHash, documentType });
      
      // Use the contract's uploadDocument method directly with MetaMask
      return new Promise((resolve, reject) => {
        this.contract.methods.uploadDocument(documentHash, documentType)
          .send({ from: this.account })
          .on('transactionHash', (hash) => {
            console.log('Transaction hash:', hash);
          })
          .on('receipt', (receipt) => {
            console.log('Receipt:', receipt);
            resolve(receipt);
          })
          .on('error', (error) => {
            console.error('Error:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }
  
  async verifyDocument(userAddress, documentIndex, status, notes) {
    try {
      // Ensure wallet is connected
      if (!this.account) {
        await this.connectWallet();
      }
      
      console.log("Verifying document:", { userAddress, documentIndex, status, notes });
      
      // Use the contract method directly with MetaMask
      return new Promise((resolve, reject) => {
        this.contract.methods.verifyDocument(userAddress, documentIndex, status, notes)
          .send({ from: this.account })
          .on('transactionHash', (hash) => {
            console.log('Transaction hash:', hash);
          })
          .on('receipt', (receipt) => {
            console.log('Receipt:', receipt);
            resolve(receipt);
          })
          .on('error', (error) => {
            console.error('Error:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      throw error;
    }
  }
  
  async getDocumentCount(userAddress) {
    try {
      const count = await this.contract.methods.getDocumentCount(userAddress).call();
      return parseInt(count);
    } catch (error) {
      console.error("Error getting document count:", error);
      throw error;
    }
  }
  
  async getDocument(userAddress, documentIndex) {
    try {
      const document = await this.contract.methods.getDocument(userAddress, documentIndex).call();
      return {
        documentHash: document[0],
        documentType: document[1],
        status: document[2],
        timestamp: document[3],
        verifier: document[4],
        notes: document[5]
      };
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  }
  
  async getNetworkInfo() {
    try {
      const networkId = await this.web3.eth.net.getId();
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasPriceInGwei = parseFloat(this.web3.utils.fromWei(gasPrice, 'gwei'));
      const latestBlock = await this.web3.eth.getBlockNumber();
      const peerCount = await this.web3.eth.net.getPeerCount();
      
      return {
        networkId: parseInt(networkId),
        gasPrice: gasPriceInGwei,
        latestBlock: parseInt(latestBlock),
        peerCount: parseInt(peerCount)
      };
    } catch (error) {
      console.error("Error getting network information:", error);
      throw error;
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;