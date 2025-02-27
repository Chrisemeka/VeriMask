// src/utils/ContractChecker.js
import Web3 from 'web3';

// Contract address from your config
const CONTRACT_ADDRESS = "0x7A950d2311E19e14F4a7A0A980dC1e24eA7bf0E0";

// Minimal ABI for checking contract existence
const MINIMAL_ABI = [
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
];

/**
 * Utility to check if the contract is deployed and accessible
 */
const checkContract = async () => {
  try {
    console.log("Checking contract deployment at address:", CONTRACT_ADDRESS);
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
      return {
        success: false,
        error: "MetaMask not installed. Please install MetaMask to use blockchain features."
      };
    }
    
    // Get the network ID
    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();
    console.log("Connected to network ID:", networkId);
    
    // Check if there's code at the address (simple check if contract exists)
    const code = await web3.eth.getCode(CONTRACT_ADDRESS);
    if (code === '0x' || code === '0x0') {
      return {
        success: false,
        error: `No contract found at address ${CONTRACT_ADDRESS} on network ${networkId}`
      };
    }
    
    console.log("Contract code found at address. Checking interface...");
    
    // Try to create a contract instance with minimal ABI
    try {
      const contract = new web3.eth.Contract(MINIMAL_ABI, CONTRACT_ADDRESS);
      
      // Try to call a simple view function (owner)
      const owner = await contract.methods.owner().call();
      
      return {
        success: true,
        details: {
          address: CONTRACT_ADDRESS,
          networkId,
          owner
        }
      };
    } catch (methodError) {
      console.error("Error calling contract method:", methodError);
      return {
        success: false,
        error: "Contract exists but doesn't match the expected interface. The ABI might be incorrect or it's not the right contract."
      };
    }
  } catch (error) {
    console.error("Contract check failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default { checkContract };