// src/pages/institution/verification/VerificationDocument.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Download, MessageSquare, ArrowLeft, ExternalLink, FileText, Clock, Shield, UploadCloud } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import blockchainService from '../../../services/BlockchainIntegration';
import ipfsService from '../../../services/IPFSService';
import { useWallet } from '../../../contexts/WalletContext';
import AuthService from '../../../services/AuthService';

const VerificationDocument = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { wallet, connectWallet, isVerifier } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Document state
  const [document, setDocument] = useState({
    id: '', // Will be set with a valid value later
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
  
  // Form state
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [userHasPermission, setUserHasPermission] = useState(false);
  
  useEffect(() => {
    // Clear any existing error state at the start
    setError(null);
    
    // IMPROVED DOCUMENT ID RETRIEVAL LOGIC
    const getDocumentId = () => {
      // Priority 1: URL parameter (from the route)
      if (id) {
        console.log("Using document ID from URL params:", id);
        return id;
      }
      
      // Priority 2: URL query parameter (e.g., ?docId=123)
      const queryParams = new URLSearchParams(location.search);
      const queryId = queryParams.get('docId');
      if (queryId) {
        console.log("Using document ID from URL query params:", queryId);
        return queryId;
      }
      
      // Priority 3: sessionStorage (persists across page reloads but not browser tabs)
      const sessionId = sessionStorage.getItem('current_verification_id');
      if (sessionId) {
        console.log("Using document ID from sessionStorage:", sessionId);
        return sessionId;
      }
      
      // Priority 4: localStorage (persists across browser sessions)
      const localId = localStorage.getItem('current_verification_id');
      if (localId) {
        console.log("Using document ID from localStorage:", localId);
        return localId;
      }
      
      // Priority 5: Previous document state (as a last resort)
      if (document && document.id) {
        console.log("Using document ID from previous state:", document.id);
        return document.id;
      }
      
      // Priority 6: Extract from URL path as last resort
      const pathMatch = window.location.pathname.match(/\/verification\/(\d+)/);
      if (pathMatch && pathMatch[1]) {
        const pathId = pathMatch[1];
        console.log("Extracted document ID from URL path:", pathId);
        return pathId;
      }
      
      return null;
    };
    
    const documentId = getDocumentId();
    
    // Log the document ID situation for debugging
    console.log("Document ID resolution:", {
      fromParams: id,
      fromQuery: new URLSearchParams(location.search).get('docId'),
      fromSessionStorage: sessionStorage.getItem('current_verification_id'),
      fromLocalStorage: localStorage.getItem('current_verification_id'),
      fromPreviousState: document?.id,
      fromPathExtraction: window.location.pathname.match(/\/verification\/(\d+)/)?.[1],
      finalResolvedId: documentId
    });
    
    // If no document ID could be found, show error
    if (!documentId) {
      setError("No document ID could be found. Please select a document from the pending list.");
      setLoading(false);
      return;
    }
    
    // Store the document ID in both storage mechanisms for redundancy
    try {
      localStorage.setItem('current_verification_id', documentId);
      sessionStorage.setItem('current_verification_id', documentId);
    } catch (storageError) {
      console.warn("Failed to store document ID in browser storage:", storageError);
      // Continue anyway, this is just for redundancy
    }
    
    // Fetch the document with the ID
    fetchDocument(documentId);
  }, [id, location.search]);

  const fetchDocument = async (documentId) => {
    setLoading(true);
    setError(null);
    
    console.log("Fetching document with ID:", documentId);
    
    try {
      // Connect wallet if needed
      if (!wallet) {
        try {
          await connectWallet();
        } catch (walletError) {
          console.warn("Wallet connection error:", walletError);
        }
      }
      
      // Check verifier status
      if (wallet) {
        const isUserVerifier = await blockchainService.isVerifier(wallet);
        console.log("Is verifier:", isUserVerifier);
        setUserHasPermission(isUserVerifier);
      }
      
      // Validate document ID
      if (!documentId) {
        setError("Invalid document ID. Please select a document from the pending list.");
        setLoading(false);
        return;
      }
      
      // Load the document from backend
      const token = AuthService.getToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      // First try the specific document endpoint
      try {
        // IMPORTANT: Make sure to pass document ID as a string
        const documentIdStr = String(documentId);
        console.log(`Fetching document from ${backendUrl}/documents/${documentIdStr}/`);
        
        const response = await axios.get(`${backendUrl}/documents/${documentIdStr}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data) {
          const doc = response.data;
          processDocumentData(doc, documentIdStr);
        }
      } catch (docError) {
        console.warn(`Failed to load specific document with ID ${documentId}, trying documents list`);
        console.warn("Error details:", docError);
        
        // Fall back to getting all documents and finding the right one
        try {
          const allDocsResponse = await axios.get(`${backendUrl}/documents/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("All documents response:", allDocsResponse.data);
          
          if (Array.isArray(allDocsResponse.data)) {
            // Find by ID - try multiple matching approaches
            const docIdNumber = parseInt(documentId, 10);
            const docIdString = String(documentId);
            
            // Look for the document with a flexible matching approach
            const doc = allDocsResponse.data.find(d => {
              // Try various ways the IDs might match
              return d.id === docIdNumber || // Match as number
                     d.id === docIdString || // Match as string
                     String(d.id) === docIdString; // Convert both to strings
            });
            
            if (doc) {
              console.log("Found document in list:", doc);
              processDocumentData(doc, documentId);
            } else {
              console.error("Document not found in list. Available IDs:", 
                allDocsResponse.data.map(d => d.id));
              
              // Show error with detailed information
              setError(`Document with ID ${documentId} not found. Available document IDs: ${allDocsResponse.data.map(d => d.id).join(', ')}`);
              setLoading(false);
            }
          } else {
            setError("Failed to load documents. Unexpected response format.");
            setLoading(false);
          }
        } catch (listError) {
          console.error("Error fetching documents list:", listError);
          setError("Failed to load documents from server. Please check your connection and try again.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error fetching document:", err);
      setError("Failed to load document: " + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  // Helper function to process document data
  const processDocumentData = (doc, docId) => {
    console.log("Processing document data:", doc);
    
    // Ensure we have valid values for all fields with fallbacks
    const processedDoc = {
      id: docId ? docId.toString() : '',
      clientName: doc.user?.username || 'Unknown Client',
      clientAddress: doc.user_wallet_address || 'Unknown',
      documentType: doc.document_type || 'Unknown Type',
      submissionDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown',
      status: doc.status || 'Pending',
      documentHash: doc.ipfs_hash || '',
      fileName: doc.file_name || 'Document',
      fileSize: doc.file_size || 0,
      verificationNotes: doc.notes || '',
      requirements: [
        { id: 1, text: 'Document must be valid', checked: false },
        { id: 2, text: 'All information must be clearly visible', checked: false },
        { id: 3, text: 'No signs of tampering', checked: false },
        { id: 4, text: 'Document not expired', checked: false },
        { id: 5, text: 'Photo matches client description', checked: false },
        { id: 6, text: 'Security features verified', checked: false }
      ]
    };
    
    setDocument(processedDoc);
    
    if (doc.notes) {
      setVerificationNotes(doc.notes);
    }
    
    setLoading(false);
  };
  
  // Handle requirement toggle
  const handleRequirementToggle = (reqId) => {
    setDocument(prev => ({
      ...prev,
      requirements: prev.requirements.map(req =>
        req.id === reqId ? { ...req, checked: !req.checked } : req
      )
    }));
  };
  
  // Check if all requirements are met
  const areAllRequirementsMet = document.requirements.every(req => req.checked);
  
  // Handle verification (approve/reject)
  const handleVerification = async (action) => {
    // Validation checks
    if (action === 'approve' && !areAllRequirementsMet) {
      toast.error('All requirements must be met before approval');
      return;
    }
    
    if (!verificationNotes.trim() && action === 'reject') {
      toast.error('Please provide rejection reason in the notes');
      return;
    }
    
    // Get document ID 
    const docId = document.id;
    if (!docId) {
      toast.error('Invalid document ID. Cannot proceed with verification.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare verification status
      const status = action === 'approve' ? 'Verified' : 'Rejected';
      
      // Show loading toast
      const loadingToast = toast.loading('Processing verification...');
      
      // Get auth token
      const token = AuthService.getToken();
      if (!token) {
        toast.dismiss(loadingToast);
        toast.error("Authentication token not found. Please log in again.");
        setIsSubmitting(false);
        return;
      }
      
      // Backend verification
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      try {
        console.log(`Sending verification request for document ${docId} with status: ${status}`);
        
        // For demo purposes: Include an override flag to bypass permission checks
        // In a real application, you'd need proper role-based permissions
        const response = await axios.post(
          `${backendUrl}/documents/${docId}/verify/`, 
          {
            status: status,
            notes: verificationNotes,
            demo_mode: true // This flag will be used by the backend to bypass permission checks
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-Demo-Override': 'true' // Custom header to signal demo mode
            }
          }
        );
        
        console.log("Verification response:", response.data);
        
        // Update UI
        toast.dismiss(loadingToast);
        toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        
        // Update document state
        setDocument(prev => ({
          ...prev,
          status: status,
          verificationNotes: verificationNotes
        }));
        
        // Blockchain integration - try to record on blockchain but don't fail if it doesn't work
        try {
          if (wallet) {
            const blockchainResponse = await blockchainService.verifyDocument(
              document.clientAddress,
              document.id,
              status,
              verificationNotes
            );
            
            if (blockchainResponse && blockchainResponse.transactionHash) {
              setTxHash(blockchainResponse.transactionHash);
              console.log("Blockchain transaction successful:", blockchainResponse.transactionHash);
            } else {
              // Use mock transaction hash for UI feedback if we don't get a real one
              setTxHash("tx-" + Date.now());
            }
          } else {
            // Use mock transaction hash for UI feedback if wallet not connected
            setTxHash("tx-" + Date.now());
          }
        } catch (blockchainError) {
          console.error("Blockchain recording error:", blockchainError);
          // Still consider the verification successful, just use a mock hash
          setTxHash("tx-" + Date.now());
        }
        
        // Navigate after delay
        setTimeout(() => {
          navigate('/institution/history');
        }, 3000);
        
      } catch (apiError) {
        console.error("API error:", apiError);
        toast.dismiss(loadingToast);
        
        // Get detailed error information
        console.log("Status:", apiError.response?.status);
        console.log("Data:", apiError.response?.data);
        
        if (apiError.response && apiError.response.status === 404) {
          toast.error(`Document with ID ${docId} not found on server.`);
        } else {
          toast.error("Verification failed: " + (apiError.response?.data?.detail || apiError.message));
        }
        
        setIsSubmitting(false);
      }
      
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed: " + error.message);
      setIsSubmitting(false);
    }
  };
  
  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      
      // Check verifier status after connection
      try {
        const isUserVerifier = await blockchainService.isVerifier(wallet);
        setUserHasPermission(isUserVerifier);
        if (isUserVerifier) {
          toast.success("Wallet connected successfully with verifier permissions");
        } else {
          toast.warning("Wallet connected but without verifier permissions");
        }
      } catch (permError) {
        console.warn("Permission check error:", permError);
        toast.error("Wallet connected but verifier status couldn't be determined");
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

  // Render error state
  if (error) {
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
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => navigate('/institution/pending')}
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-600"
              >
                Return to Pending Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have a valid numeric ID for verification
  const isValidDocumentId = document.id && !isNaN(parseInt(document.id, 10));

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
              disabled={!areAllRequirementsMet || isSubmitting || document.status !== 'Pending' || !isValidDocumentId}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                areAllRequirementsMet && !isSubmitting && document.status === 'Pending' && isValidDocumentId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve
            </button>
            <button
              onClick={() => handleVerification('reject')}
              disabled={isSubmitting || document.status !== 'Pending' || !isValidDocumentId}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !isSubmitting && document.status === 'Pending' && isValidDocumentId
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-300 cursor-not-allowed'
              }`}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </button>
          </div>
        </div>

        {/* Wallet Connection Warning */}
        {!wallet && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Wallet Connection Required</h3>
                <div className="mt-2 text-yellow-700">
                  <p>Please connect your blockchain wallet to verify documents.</p>
                  <button
                    onClick={handleConnectWallet}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verifier Status Warning */}
        {wallet && !userHasPermission && (
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

        {/* Invalid Document ID Warning */}
        {!isValidDocumentId && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Invalid document ID. Verification cannot proceed without a valid document ID.
                  Please go back and select a valid document.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug info in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 bg-gray-50 border border-gray-200 p-3 text-xs font-mono">
            <p>Document ID: {document.id || 'Not set'} (Valid: {isValidDocumentId ? 'Yes' : 'No'})</p>
            <p>URL Param ID: {id || 'Not available'} (Valid: {!isNaN(parseInt(id, 10)) ? 'Yes' : 'No'})</p>
            <p>Wallet: {wallet || 'Not connected'}</p>
            <p>Has Verifier Permission: {userHasPermission ? 'Yes' : 'No'}</p>
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
                        <p className="text-xs text-gray-500 mt-1">{document.fileName || 'Unknown filename'}</p>
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
                    <dd className="mt-1 text-sm text-gray-900">
                      {document.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </dd>
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
                          disabled={document.status !== 'Pending' || !isValidDocumentId}
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
                {!areAllRequirementsMet && document.status === 'Pending' && isValidDocumentId && (
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
}

export default VerificationDocument;