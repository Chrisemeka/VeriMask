// src/components/common/UploadModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, File, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ipfsService from '../../services/IPFSService';
import { useWallet } from '../../contexts/WalletContext';
import Web3 from 'web3';

const UploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, connectWallet } = useWallet();
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('idle'); // idle, uploading-ipfs, uploading-blockchain, complete, error
  const [uploadResult, setUploadResult] = useState(null);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after closing animation
      setTimeout(() => {
        setSelectedFile(null);
        setDocumentType('');
        setProgress('idle');
        setUploadResult(null);
      }, 300);
    }
  }, [isOpen]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }
    
    // Check if wallet is connected
    if (!wallet) {
      try {
        await connectWallet();
      } catch (error) {
        toast.error('Please connect your wallet to upload documents');
        return;
      }
    }
    
    setUploading(true);
    setProgress('uploading-ipfs');
    
    try {
      // Step 1: Upload to IPFS
      const ipfsUploadToast = toast.loading('Uploading to IPFS...');
      let ipfsHash;
      
      try {
        ipfsHash = await ipfsService.uploadFile(selectedFile);
        toast.dismiss(ipfsUploadToast);
        toast.success('File uploaded to IPFS');
      } catch (ipfsError) {
        toast.dismiss(ipfsUploadToast);
        toast.error('Failed to upload to IPFS: ' + ipfsError.message);
        throw ipfsError;
      }
      
      // Step 2: Record on blockchain
      setProgress('uploading-blockchain');
      const blockchainToast = toast.loading('Preparing blockchain transaction...');
      
      try {
        // Directly interact with web3 and contract using window.ethereum
        if (!window.ethereum) {
          throw new Error("MetaMask not found. Please install MetaMask extension.");
        }
        
        // Get the contract address and ABI from script tags or config
        const contractAddress = "0x7A950d2311E19e14F4a7A0A980dC1e24eA7bf0E0";
        
        // Request accounts (triggers MetaMask)
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Please unlock MetaMask.");
        }
        
        // Get web3 instance
        const web3 = new Web3(window.ethereum);
        
        // Create contract instance 
        const contract = new web3.eth.Contract(
          // ABI shortened for brevity - use the full ABI in your code
          [
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
            }
          ],
          contractAddress
        );
        
        toast.dismiss(blockchainToast);
        toast.loading('Please confirm the transaction in MetaMask...');
        
        // Call the contract method directly
        const gasPrice = await web3.eth.getGasPrice(); // Fetch current gas price

        const gasEstimate = await contract.methods.uploadDocument(ipfsHash, documentType).estimateGas({
          from: accounts[0]
        });
        
        const receipt = await contract.methods.uploadDocument(ipfsHash, documentType).send({
          from: accounts[0],
          gas: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer
          gasPrice: gasPrice // Use legacy gas pricing
        });
        
        toast.dismiss();
        toast.success('Document recorded on blockchain');
        
        // Set result and update status
        setUploadResult({
          ipfsHash,
          transactionHash: receipt.transactionHash,
          documentType
        });
        
        setProgress('complete');
        
        // Callback if provided
        if (onSuccess) {
          onSuccess({
            ipfsHash,
            transactionHash: receipt.transactionHash,
            documentType,
            fileName: selectedFile.name
          });
        }
      } catch (blockchainError) {
        toast.dismiss();
        console.error('Blockchain error:', blockchainError);
        
        // Check if the transaction was rejected by the user
        if (blockchainError.message && blockchainError.message.includes('User denied')) {
          toast.error('Transaction rejected in MetaMask');
        } else {
          toast.error('Blockchain error: ' + blockchainError.message);
        }
        
        // Set a result with just the IPFS hash so the user can try again later
        setUploadResult({
          ipfsHash,
          transactionHash: null,
          documentType,
          error: blockchainError.message
        });
        
        setProgress('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error(`Upload failed: ${error.message}`);
      setProgress('error');
    } finally {
      setUploading(false);
    }
  };

  const retryBlockchainUpload = async () => {
    if (!uploadResult || !uploadResult.ipfsHash) return;
    
    setUploading(true);
    setProgress('uploading-blockchain');
    
    const blockchainToast = toast.loading('Retrying blockchain recording...');
    
    try {
      // Connect wallet
      if (!wallet) {
        await connectWallet();
      }
      
      // Same web3 direct implementation as above
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask extension.");
      }
      
      const contractAddress = "0x7A950d2311E19e14F4a7A0A980dC1e24eA7bf0E0";
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.");
      }
      
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        [
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
          }
        ],
        contractAddress
      );
      
      toast.dismiss(blockchainToast);
      toast.loading('Please confirm the transaction in MetaMask...');
      
      const gasEstimate = await contract.methods.uploadDocument(uploadResult.ipfsHash, uploadResult.documentType).estimateGas({
        from: accounts[0]
      });
      
      const receipt = await contract.methods.uploadDocument(uploadResult.ipfsHash, uploadResult.documentType).send({
        from: accounts[0],
        gas: Math.floor(gasEstimate * 1.2)
      });
      
      toast.dismiss();
      toast.success('Document recorded on blockchain');
      
      // Update the result
      setUploadResult({
        ...uploadResult,
        transactionHash: receipt.transactionHash,
        error: null
      });
      
      setProgress('complete');
      
      // Callback if provided
      if (onSuccess) {
        onSuccess({
          ipfsHash: uploadResult.ipfsHash,
          transactionHash: receipt.transactionHash,
          documentType: uploadResult.documentType,
          fileName: selectedFile ? selectedFile.name : 'Unknown'
        });
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Blockchain error: ' + error.message);
      
      setUploadResult({
        ...uploadResult,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Upload Document</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                disabled={uploading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Wallet Warning */}
            {!wallet && (
              <div className="mb-4 bg-yellow-50 p-3 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-700">
                    You need to connect a wallet to upload documents.
                  </p>
                </div>
                <button
                  onClick={connectWallet}
                  className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {progress !== 'complete' ? (
              <form onSubmit={handleSubmit}>
                {/* Document Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    disabled={uploading}
                    required
                  >
                    <option value="">Select a document type</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                    <option value="utility_bill">Utility Bill</option>
                    <option value="bank_statement">Bank Statement</option>
                  </select>
                </div>

                {/* File Upload Area */}
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <div className="flex flex-col items-center">
                      {selectedFile ? (
                        <div className="flex items-center mb-2">
                          <File className="h-8 w-8 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-600">{selectedFile.name}</span>
                        </div>
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={uploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                {progress === 'uploading-ipfs' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-700">Uploading to IPFS...</p>
                  </div>
                )}

                {progress === 'uploading-blockchain' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-700">Recording on blockchain... Check MetaMask for the transaction prompt.</p>
                  </div>
                )}

                {progress === 'error' && uploadResult && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                      <p className="text-sm text-yellow-700">Partially completed: File uploaded to IPFS but blockchain recording failed.</p>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-yellow-700">IPFS Hash:</p>
                      <p className="text-xs font-mono text-yellow-700 break-all">{uploadResult.ipfsHash}</p>
                      
                      <p className="font-medium text-yellow-700 mt-2">Error:</p>
                      <p className="text-xs text-yellow-700">{uploadResult.error}</p>
                      
                      <button 
                        onClick={retryBlockchainUpload}
                        disabled={uploading}
                        className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        Retry Blockchain Recording
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    disabled={!selectedFile || !documentType || uploading || !wallet}
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                <div className="p-4 bg-green-50 rounded-md mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-lg font-medium text-green-800">Upload Successful!</h3>
                  </div>
                  <div className="mt-3 ml-9 text-sm">
                    <p className="text-green-700 mb-2">Your document has been securely stored on IPFS and recorded on the blockchain.</p>
                    
                    <div className="mt-3 mb-1">
                      <p className="text-sm font-medium text-green-800">Document Type:</p>
                      <p className="text-sm text-green-700">{documentType}</p>
                    </div>
                    
                    <div className="mb-1">
                      <p className="text-sm font-medium text-green-800">IPFS Hash:</p>
                      <p className="text-xs font-mono text-green-700 break-all">{uploadResult?.ipfsHash}</p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-800">Transaction Hash:</p>
                      <p className="text-xs font-mono text-green-700 break-all">{uploadResult?.transactionHash}</p>
                    </div>
                    
                    <a 
                      href={ipfsService.getFileUrl(uploadResult?.ipfsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View document on IPFS
                    </a>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setDocumentType('');
                      setProgress('idle');
                      setUploadResult(null);
                    }}
                    className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;