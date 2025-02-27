// src/contexts/WalletContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import blockchainService from '../services/BlockchainIntegration';
import { toast } from 'react-hot-toast';

// Create context
export const WalletContext = createContext();

// Context provider component
export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  
  // Auto-connect on mount if possible
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        try {
          await connectWallet();
        } catch (error) {
          console.log("Auto-connect failed:", error);
        }
      }
    };
    
    autoConnect();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          // Check verifier status for new account
          checkVerifierStatus(accounts[0]);
        } else {
          setWallet(null);
          setIsVerifier(false);
        }
      });
    }
    
    return () => {
      // Clean up listeners when component unmounts
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);
  
  // Connect wallet function
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Initialize blockchain service
      await blockchainService.init();
      
      // Connect wallet
      const address = await blockchainService.connectWallet();
      setWallet(address);
      
      // Get network info
      try {
        const netInfo = await blockchainService.getNetworkInfo();
        setNetworkId(netInfo.networkId);
      } catch (netError) {
        console.warn("Error getting network info:", netError);
      }
      
      // Check if verifier
      await checkVerifierStatus(address);
      
      return address;
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet. Make sure MetaMask is unlocked.");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Check if wallet is a verifier
  const checkVerifierStatus = async (address) => {
    try {
      if (!address) return false;
      const verifier = await blockchainService.isVerifier(address);
      setIsVerifier(verifier);
      return verifier;
    } catch (error) {
      console.warn("Verifier check error:", error);
      setIsVerifier(false);
      return false;
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setWallet(null);
    setIsVerifier(false);
    // Note: MetaMask doesn't support programmatic disconnection,
    // this just clears the state in our app
  };
  
  return (
    <WalletContext.Provider 
      value={{
        wallet,
        isConnecting,
        connectWallet,
        disconnectWallet,
        isVerifier,
        networkId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook for using the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};