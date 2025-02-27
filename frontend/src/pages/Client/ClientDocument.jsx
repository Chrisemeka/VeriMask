// src/pages/Client/ClientDocument.jsx
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Eye, Clock, CheckCircle, XCircle, AlertTriangle, ExternalLink, Wallet } from 'lucide-react';
import UploadModal from '../../components/common/UploadModal';
import ipfsService from '../../services/IPFSService';
import blockchainService from '../../services/BlockchainIntegration';
import { toast } from 'react-hot-toast';

const ClientDocument = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [blockchainConnected, setBlockchainConnected] = useState(false);

  // Load documents from blockchain when component mounts
  useEffect(() => {
    async function initializeBlockchain() {
      try {
        // Initialize blockchain connection
        const initialized = await blockchainService.init();
        setBlockchainConnected(initialized);
        
        if (initialized) {
          try {
            // Try to connect wallet
            const account = await blockchainService.connectWallet();
            if (account) {
              setWallet(account);
              // Load documents for the connected wallet
              loadDocuments(account);
            }
          } catch (walletError) {
            console.warn("Wallet not connected yet:", walletError);
            // Don't show error, the user will connect manually
          }
        }
      } catch (error) {
        console.error("Blockchain initialization error:", error);
        toast.error("Failed to connect to blockchain network. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    
    initializeBlockchain();
  }, []);

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const account = await blockchainService.connectWallet();
      setWallet(account);
      toast.success("Wallet connected successfully");
      loadDocuments(account);
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet. Please check MetaMask.");
    } finally {
      setLoading(false);
    }
  };

  // Load documents from blockchain
  // Find this section in your ClientDocument.jsx file
const loadDocuments = async (address) => {
  setLoading(true);
  try {
    // Get document count for the user
    const count = await blockchainService.getDocumentCount(address);
    
    // Load each document from blockchain
    const loadedDocuments = [];
    for (let i = 0; i < count; i++) {
      const doc = await blockchainService.getDocument(address, i);
      
      // Change this part to convert the BigInt timestamp to a Number
      loadedDocuments.push({
        id: i,
        name: `Document_${i + 1}`,
        type: doc.documentType,
        status: doc.status,
        // Convert BigInt to Number before creating Date object
        uploadDate: new Date(Number(doc.timestamp) * 1000).toISOString().split('T')[0],
        fileSize: '~',
        documentHash: doc.documentHash,
        notes: doc.notes,
        verifier: doc.verifier,
      });
    }
    
    setDocuments(loadedDocuments);
  } catch (error) {
    console.error("Error loading documents:", error);
    toast.error("Failed to load documents. Please check your wallet connection.");
  } finally {
    setLoading(false);
  }
};

  // Handle document upload success
  const handleUploadSuccess = (documentData) => {
    // Add the new document to the list
    const newDocument = {
      id: documents.length,
      name: documentData.fileName || `Document_${documents.length + 1}`,
      type: documentData.documentType,
      status: 'Pending',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: '~',
      documentHash: documentData.ipfsHash,
    };
    
    setDocuments([newDocument, ...documents]);
    
    // Refresh documents from blockchain to get the latest
    if (wallet) {
      setTimeout(() => loadDocuments(wallet), 2000);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Render wallet connection prompt if not connected
  if (!loading && !wallet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
        </div>
        
        <div className="mt-8 text-center py-12 bg-white shadow rounded-lg">
          <Wallet className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Please connect your Ethereum wallet to view and manage your documents. 
            All documents will be secured on the blockchain.
          </p>
          <button
            onClick={handleConnectWallet}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Render loading indicator
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Wallet info */}
        {wallet && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Wallet className="h-4 w-4 mr-1" />
            Connected wallet: <span className="font-mono ml-1">{wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}</span>
            <button 
              onClick={handleConnectWallet} 
              className="ml-3 text-blue-500 hover:text-blue-700 underline text-xs"
            >
              Change
            </button>
          </div>
        )}

        {/* Document List */}
        <div className="mt-8">
          {documents.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No Documents Found</h3>
              <p className="mt-1 text-gray-500">
                You haven't uploaded any documents yet. Click the "Upload Document" button to get started.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {documents.map((document) => (
                  <li key={document.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h2 className="text-sm font-medium text-blue-600">{document.name}</h2>
                            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                              {document.status}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            <span>{document.type}</span>
                            <span className="mx-2">•</span>
                            <span>Uploaded on {document.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <a
                          href={ipfsService.getFileUrl(document.documentHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-500"
                          title="View on IPFS"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                    
                    {document.status === 'Rejected' && document.notes && (
                      <div className="mt-2 ml-10 p-2 bg-red-50 text-sm text-red-700 rounded">
                        <p className="font-medium">Rejection reason:</p>
                        <p>{document.notes}</p>
                      </div>
                    )}
                    
                    {document.status === 'Verified' && document.verifier && (
                      <div className="mt-2 ml-10 text-xs text-gray-500">
                        <span>Verified by {document.verifier.substring(0, 6)}...{document.verifier.substring(document.verifier.length - 4)}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ClientDocument;