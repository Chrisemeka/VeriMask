// src/pages/institution/verification/VerificationDocument.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Download, MessageSquare, ArrowLeft, ExternalLink, FileText, Clock, Shield, UploadCloud} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import blockchainService from '../../../services/BlockchainIntegration';
import ipfsService from '../../../services/IPFSService';

const VerificationDocument = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState({
    id: '',
    clientName: '',
    clientAddress: '',
    documentType: '',
    submissionDate: '',
    status: 'Pending',
    imageUrl: '',
    documentHash: '',
    verificationNotes: '',
    requirements: [
      { id: 1, text: 'Document must be valid', checked: false },
      { id: 2, text: 'All information must be clearly visible', checked: false },
      { id: 3, text: 'No signs of tampering', checked: false },
      { id: 4, text: 'Document not expired', checked: false },
      { id: 5, text: 'Photo matches client description', checked: false },
      { id: 6, text: 'Security features verified', checked: false }
    ]
  });

  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [blockchainConnected, setBlockchainConnected] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [demoMode, setDemoMode] = useState(false); // For demo purposes

  // Load document data
  useEffect(() => {
    async function initializeAndLoadDocument() {
      setLoading(true);
      try {
        // Initialize blockchain connection
        const initialized = await blockchainService.init();
        setBlockchainConnected(initialized);
        
        if (initialized && id) {
          // Connect wallet
          const account = await blockchainService.connectWallet();
          
          // Check verifier permissions
          try {
            const verifier = await blockchainService.isVerifier(account);
            setIsVerifier(verifier);
          } catch (error) {
            console.warn("Verifier check error:", error);
            setIsVerifier(false);
          }
          
          // In a real implementation, you would call an API to get the client address and document index
          // then use blockchainService.getDocument(clientAddress, documentIndex)
          
          // For demo purposes, we'll load mock data
          loadMockDocument(id);
          setDemoMode(true);
        }
      } catch (error) {
        console.error("Document loading error:", error);
        toast.error("Failed to load document. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    
    initializeAndLoadDocument();
  }, [id]);

  // Load mock document data for demo
  const loadMockDocument = (documentId) => {
    const mockDocuments = {
      1: {
        id: documentId,
        clientName: 'John Doe',
        clientAddress: '0x1234567890123456789012345678901234567890',
        documentType: 'Passport',
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        documentHash: 'QmXb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDXXX',
        verificationNotes: '',
        requirements: [
          { id: 1, text: 'Document must be valid', checked: false },
          { id: 2, text: 'All information must be clearly visible', checked: false },
          { id: 3, text: 'No signs of tampering', checked: false },
          { id: 4, text: 'Document not expired', checked: false },
          { id: 5, text: 'Photo matches client description', checked: false },
          { id: 6, text: 'Security features verified', checked: false }
        ]
      },
      2: {
        id: documentId,
        clientName: 'Jane Smith',
        clientAddress: '0x0987654321098765432109876543210987654321',
        documentType: 'Driver\'s License',
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        documentHash: 'QmYb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDYYY',
        verificationNotes: '',
        requirements: [
          { id: 1, text: 'Document must be valid', checked: false },
          { id: 2, text: 'All information must be clearly visible', checked: false },
          { id: 3, text: 'No signs of tampering', checked: false },
          { id: 4, text: 'Document not expired', checked: false },
          { id: 5, text: 'Photo matches client description', checked: false },
          { id: 6, text: 'Security features verified', checked: false }
        ]
      },
      3: {
        id: documentId,
        clientName: 'Robert Johnson',
        clientAddress: '0x5555555555555555555555555555555555555555',
        documentType: 'National ID',
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        documentHash: 'QmZb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDZZZ',
        verificationNotes: '',
        requirements: [
          { id: 1, text: 'Document must be valid', checked: false },
          { id: 2, text: 'All information must be clearly visible', checked: false },
          { id: 3, text: 'No signs of tampering', checked: false },
          { id: 4, text: 'Document not expired', checked: false },
          { id: 5, text: 'Photo matches client description', checked: false },
          { id: 6, text: 'Security features verified', checked: false }
        ]
      }
    };
    
    // Load the document or default to the first one
    const doc = mockDocuments[documentId] || mockDocuments[1];
    setDocument(doc);
  };

  const handleRequirementToggle = (reqId) => {
    setDocument(prev => ({
      ...prev,
      requirements: prev.requirements.map(req =>
        req.id === reqId ? { ...req, checked: !req.checked } : req
      )
    }));
  };

  const areAllRequirementsMet = document.requirements.every(req => req.checked);

  const handleVerification = async (action) => {
    if (action === 'approve' && !areAllRequirementsMet) {
      toast.error('All requirements must be met before approval');
      return;
    }
    
    if (action === 'reject' && !verificationNotes.trim()) {
      toast.error('Please provide rejection reason in the notes');
      return;
    }
    
    // If not a verifier and not in demo mode, block the operation
    if (!isVerifier && !demoMode) {
      toast.error('You do not have verifier permissions');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare verification status
      const status = action === 'approve' ? 'Verified' : 'Rejected';
      
      // Call blockchain service to verify document
      const verificationToast = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} document...`);
      
      try {
        if (demoMode) {
          // Simulate blockchain transaction in demo mode
          await new Promise(resolve => setTimeout(resolve, 2000));
          setTxHash('0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
        } else {
          // Real blockchain transaction
          const receipt = await blockchainService.verifyDocument(
            document.clientAddress,
            document.id,
            status,
            verificationNotes
          );
          
          setTxHash(receipt.transactionHash);
        }
        
        toast.dismiss(verificationToast);
        toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        
        // Update local document state
        setDocument(prev => ({
          ...prev,
          status: status,
          verificationNotes: verificationNotes
        }));
        
        // Wait a moment before navigating back
        setTimeout(() => {
          navigate('/institution/history');
        }, 3000);
      } catch (error) {
        toast.dismiss(verificationToast);
        toast.error(`Verification failed: ${error.message}`);
        console.error("Verification error:", error);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      const account = await blockchainService.connectWallet();
      if (account) {
        setBlockchainConnected(true);
        
        // Check verifier status
        try {
          const verifier = await blockchainService.isVerifier(account);
          setIsVerifier(verifier);
        } catch (error) {
          console.warn("Verifier check error:", error);
          setIsVerifier(false);
        }
      }
    } catch (error) {
      console.error("Connect wallet error:", error);
      toast.error("Failed to connect wallet. Please check MetaMask.");
    }
  };

  // Render loading indicator
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render blockchain connection error
  if (!blockchainConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">Blockchain Connection Required</h3>
              <div className="mt-2 text-yellow-700">
                <p>Please connect your wallet to verify documents. This application requires MetaMask or a similar Web3 wallet.</p>
                <button 
                  onClick={handleConnectWallet}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Verifications
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Document Verification</h1>
            <p className="mt-2 text-sm text-gray-600">Review and verify the submitted document</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleVerification('approve')}
              disabled={!areAllRequirementsMet || isSubmitting || document.status !== 'Pending'}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                areAllRequirementsMet && !isSubmitting && document.status === 'Pending'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve
            </button>
            <button
              onClick={() => handleVerification('reject')}
              disabled={isSubmitting || document.status !== 'Pending'}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !isSubmitting && document.status === 'Pending'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-300 cursor-not-allowed'
              }`}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </button>
          </div>
        </div>

        {/* Verifier Status Warning */}
        {!isVerifier && demoMode && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your account doesn't have verifier permissions. In production, you would need these permissions 
                  to verify documents. For demo purposes, you can still verify documents.
                </p>
                <p className="mt-1 text-sm text-yellow-700">
                  <a 
                    href="/admin/add-verifier" 
                    className="font-medium underline"
                  >
                    Go to Admin to add verifier permissions
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Document Preview Section */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
                  Document Preview
                </h2>
                
                {/* Document Display - Replace with actual document viewer */}
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
                  <div className="aspect-w-16 aspect-h-9 sm:aspect-w-4 sm:aspect-h-5">
                    <div className="flex items-center justify-center h-full p-10 bg-gray-50">
                      <div className="text-center">
                        <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Document stored on IPFS</p>
                        <p className="text-gray-400 text-sm font-mono mt-2 break-all">{document.documentHash}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <a 
                    href={ipfsService.getFileUrl(document.documentHash)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View on IPFS
                  </a>
                </div>
              </div>
            </div>

            {/* Document Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-gray-500" />
                  Document Information
                </h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Client Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.clientName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.documentType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.submissionDate}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm">
                      {document.status === 'Verified' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verified
                        </span>
                      )}
                      {document.status === 'Pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-4 w-4 mr-1" />
                          Pending
                        </span>
                      )}
                      {document.status === 'Rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejected
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Blockchain Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">{document.clientAddress}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Verification Section */}
          <div className="space-y-6">
            {/* Requirements Checklist */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Requirements</h2>
                <div className="space-y-4">
                  {document.requirements.map((req) => (
                    <div key={req.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`requirement-${req.id}`}
                          type="checkbox"
                          checked={req.checked}
                          onChange={() => handleRequirementToggle(req.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={document.status !== 'Pending'}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`requirement-${req.id}`} className={`font-medium ${document.status !== 'Pending' ? 'text-gray-500' : 'text-gray-700'}`}>
                          {req.text}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                {!areAllRequirementsMet && document.status === 'Pending' && (
                  <div className="mt-4 flex items-center text-sm text-yellow-600">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    All requirements must be met before approval
                  </div>
                )}
              </div>
            </div>

            {/* Verification Notes */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
                    Verification Notes
                  </div>
                </h2>
                {document.status !== 'Pending' ? (
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-700">{document.verificationNotes || 'No notes provided.'}</p>
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about the verification process..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              </div>
            </div>

            {/* Transaction Information (when transaction is complete) */}
            {txHash && (
              <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h2>
                  <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Verification recorded on blockchain
                        </p>
                        <p className="mt-1 text-xs text-green-700">
                          Transaction Hash:
                        </p>
                        <p className="mt-1 text-xs font-mono break-all">
                          {txHash}
                        </p>
                        <p className="mt-3 text-sm text-green-700">
                          Redirecting to verification history...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submission in progress */}
            {isSubmitting && !txHash && (
              <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-blue-700">Processing blockchain transaction...</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Please wait while the verification is being recorded on the blockchain. This may take a few moments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDocument;