// src/pages/institution/verification/PendingVerification.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import blockchainService from '../../../services/BlockchainIntegration';

const PendingVerification = () => {
  const navigate = useNavigate();
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  // Initialize blockchain and load data
  useEffect(() => {
    const initBlockchain = async () => {
      setLoading(true);
      try {
        // Initialize blockchain connection
        await blockchainService.init();
        
        // Connect wallet
        const account = await blockchainService.connectWallet();
        if (account) {
          setWalletConnected(true);
          
          // Check if account is a verifier - but don't block the view if not
          try {
            const verifier = await blockchainService.isVerifier(account);
            setIsVerifier(verifier);
          } catch (verifierError) {
            console.warn("Verifier check error:", verifierError);
            // Continue anyway
          }
          
          // For demo, load mock data regardless of verifier status
          // In production, load only documents the user is authorized to verify
          loadPendingDocuments();
        }
      } catch (err) {
        console.error("Blockchain initialization error:", err);
        setError("Failed to connect to blockchain. Please check your wallet connection.");
      } finally {
        setLoading(false);
      }
    };
    
    initBlockchain();
  }, []);

  // Load pending documents
  const loadPendingDocuments = () => {
    // In production, you would fetch this data from your backend
    // which would sync with blockchain events for pending documents
    
    // For demo, using mock data
    const mockPendingDocuments = [
      {
        id: 1,
        clientName: 'John Doe',
        clientAddress: '0x1234567890123456789012345678901234567890',
        documentType: 'Passport',
        submittedDate: '2025-02-24',
        priority: 'high',
        timeInQueue: '2 hours',
        documentHash: 'QmXb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDXXX'
      },
      {
        id: 2,
        clientName: 'Jane Smith',
        clientAddress: '0x0987654321098765432109876543210987654321',
        documentType: 'Driver\'s License',
        submittedDate: '2025-02-23',
        priority: 'medium',
        timeInQueue: '1 day',
        documentHash: 'QmYb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDYYY'
      },
      {
        id: 3,
        clientName: 'Robert Johnson',
        clientAddress: '0x5555555555555555555555555555555555555555',
        documentType: 'National ID',
        submittedDate: '2025-02-23',
        priority: 'low',
        timeInQueue: '1 day',
        documentHash: 'QmZb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDZZZ'
      },
    ];
    
    setPendingDocuments(mockPendingDocuments);
  };

  // Handle document review
  const handleReviewDocument = (docId) => {
    // Check verifier status before allowing review
    if (!isVerifier) {
      toast.error("You don't have verifier permissions. Demo mode: proceeding anyway.");
      // In production, you might want to block non-verifiers here
    }
    
    navigate(`/institution/verification/${docId}`);
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and search documents
  const filteredDocuments = pendingDocuments.filter(doc => {
    // Apply search filter
    const matchesSearch = searchTerm === '' ||
      doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply priority filter
    const matchesPriority = filterPriority === 'all' || doc.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      const account = await blockchainService.connectWallet();
      if (account) {
        setWalletConnected(true);
        
        // Check verifier status
        try {
          const verifier = await blockchainService.isVerifier(account);
          setIsVerifier(verifier);
        } catch (verifierError) {
          console.warn("Verifier check error:", verifierError);
        }
        
        // Load documents regardless of verifier status
        loadPendingDocuments();
      }
    } catch (error) {
      console.error("Connect wallet error:", error);
      toast.error("Failed to connect wallet. Please check MetaMask.");
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Pending Verifications</h1>
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render wallet connection prompt
  if (!walletConnected) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Pending Verifications</h1>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">Wallet Connection Required</h3>
              <div className="mt-2 text-yellow-700">
                <p>Please connect your blockchain wallet to access verification functions.</p>
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
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Pending Verifications</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all pending document verifications that require your attention.
          </p>
        </div>
      </div>
      
      {/* Verifier Status Warning */}
      {!isVerifier && (
        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your account doesn't have verifier permissions. In production, you would need these permissions 
                to verify documents. For demo purposes, you can still view and interact with documents.
              </p>
              <div className="mt-2">
                <a 
                  href="/admin/add-verifier" 
                  className="text-sm text-yellow-700 font-medium underline"
                >
                  Go to Admin to add verifier permissions
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0 sm:mr-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by client name or document type..."
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Pending Documents Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {filteredDocuments.length === 0 ? (
                <div className="bg-white py-6 px-4 text-center">
                  <p className="text-gray-500">No pending verifications match your criteria.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Document Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Submitted Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Priority</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Time in Queue</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{doc.clientName}</span>
                            <span className="text-gray-500 text-xs font-mono">{doc.clientAddress.substring(0, 8)}...{doc.clientAddress.substring(doc.clientAddress.length - 6)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{doc.documentType}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{doc.submittedDate}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPriorityBadgeColor(doc.priority)}`}>
                            {doc.priority}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {doc.timeInQueue}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleReviewDocument(doc.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingVerification;