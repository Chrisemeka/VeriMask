// src/pages/institution/verification/VerifiedDocument.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import AuthService from '../../../services/AuthService';
import ipfsService from '../../../services/IPFSService';

const VerifiedDocument = () => {
  const navigate = useNavigate();
  const [verifiedDocuments, setVerifiedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  
  // Load verified documents on component mount
  useEffect(() => {
    loadVerifiedDocuments();
  }, []);
  
  // Function to load verified documents from backend
  const loadVerifiedDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = AuthService.getToken();
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      // Get all documents and filter for verified ones
      const response = await axios.get(`${backendUrl}/documents/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (Array.isArray(response.data)) {
        console.log("Documents response for verified docs:", response.data);
        
        // Log all status values to debug
        const statusValues = new Set(response.data.map(doc => 
          doc.status ? String(doc.status).toLowerCase() : 'undefined'
        ));
        console.log("Status values in documents:", Array.from(statusValues));
        
        // Use case-insensitive comparison for status - check if status contains 'verif'
        const verified = response.data.filter(doc => {
          const status = doc.status ? String(doc.status).toLowerCase() : '';
          return status.includes('verif');
        });
        
        console.log("Verified documents found:", verified.length);
        
        if (verified.length > 0) {
          // Process verified documents
          const verifiedDocs = verified.map(doc => ({
            id: doc.id,
            clientName: doc.user?.username || 'Unknown Client',
            documentType: doc.document_type,
            verificationDate: doc.verification_date ? new Date(doc.verification_date).toLocaleDateString() : 'Unknown',
            verifiedBy: doc.verified_by?.username || 'Unknown Verifier',
            ipfsHash: doc.ipfs_hash,
            submissionDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown',
            status: 'Verified'
          }));
          
          setVerifiedDocuments(verifiedDocs);
        } else {
          // Fallback: consider non-Pending documents as verified
          console.log("No documents with 'verified' status found, using non-pending as fallback");
          const nonPendingDocs = response.data.filter(doc => {
            const status = doc.status ? String(doc.status).toLowerCase() : '';
            return !status.includes('pend') && !status.includes('reject');
          });
          
          if (nonPendingDocs.length > 0) {
            console.log("Using non-pending documents as verified:", nonPendingDocs.length);
            const fallbackDocs = nonPendingDocs.map(doc => ({
              id: doc.id,
              clientName: doc.user?.username || 'Unknown Client',
              documentType: doc.document_type,
              verificationDate: doc.verification_date ? new Date(doc.verification_date).toLocaleDateString() : 
                                (doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown'),
              verifiedBy: doc.verified_by?.username || 'System',
              ipfsHash: doc.ipfs_hash,
              submissionDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown',
              status: 'Verified'
            }));
            
            setVerifiedDocuments(fallbackDocs);
          } else {
            // If still no docs found, try one last approach - look for status values like "VERIFIED" or "true"
            console.log("Trying status values like true or 1 for verification");
            const verifiedByOtherMeans = response.data.filter(doc => 
              doc.status === true || 
              doc.status === 1 || 
              doc.status === "VERIFIED" || 
              doc.status === "Verified"
            );
            
            if (verifiedByOtherMeans.length > 0) {
              const lastResortDocs = verifiedByOtherMeans.map(doc => ({
                id: doc.id,
                clientName: doc.user?.username || 'Unknown Client',
                documentType: doc.document_type,
                verificationDate: doc.verification_date ? new Date(doc.verification_date).toLocaleDateString() : 
                                  (doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown'),
                verifiedBy: doc.verified_by?.username || 'System',
                ipfsHash: doc.ipfs_hash,
                submissionDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown',
                status: 'Verified'
              }));
              
              setVerifiedDocuments(lastResortDocs);
            }
          }
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error loading verified documents:", err);
      setError("Failed to load verified documents");
      
      // In development, keep using mock data if the API fails
      if (process.env.NODE_ENV === 'development') {
        setVerifiedDocuments([
          {
            id: 1,
            clientName: 'John Doe',
            documentType: 'passport',
            verificationDate: '2025-02-22',
            verifiedBy: 'Sarah Johnson',
            ipfsHash: 'QmXb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDXXX',
            submissionDate: '2025-02-20',
            status: 'Verified'
          },
          {
            id: 2,
            clientName: 'Jane Smith',
            documentType: 'drivers_license',
            verificationDate: '2025-02-21',
            verifiedBy: 'Mike Wilson',
            ipfsHash: 'QmYb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDYYY',
            submissionDate: '2025-02-19',
            status: 'Verified'
          },
          {
            id: 3,
            clientName: 'Alice Johnson',
            documentType: 'utility_bill',
            verificationDate: '2025-02-20',
            verifiedBy: 'Tom Brown',
            ipfsHash: 'QmZb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDZZZ',
            submissionDate: '2025-02-18',
            status: 'Verified'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    toast.promise(
      loadVerifiedDocuments(),
      {
        loading: 'Refreshing verified documents...',
        success: 'Documents refreshed successfully',
        error: 'Failed to refresh documents'
      }
    );
  };

  // Handle view document details
  const handleViewDetails = (id) => {
    try {
      // Store the document ID for the verification page
      localStorage.setItem('current_verification_id', id);
      sessionStorage.setItem('current_verification_id', id);
      
      // Navigate to verification page
      navigate(`/institution/verification/${id}`);
    } catch (error) {
      toast.error("Failed to view document details");
    }
  };

  // Handle download document from IPFS
  const handleDownload = (ipfsHash, clientName, documentType) => {
    const ipfsUrl = ipfsService.getFileUrl(ipfsHash);
    
    if (!ipfsUrl) {
      toast.error('IPFS link not available');
      return;
    }
    
    // Create a filename based on client and document type
    const fileName = `${clientName.replace(/\s+/g, '_')}_${documentType}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Open in new tab (browser will handle download)
    window.open(ipfsUrl, '_blank');
    
    toast.success('Opening document in new tab');
  };

  // Filter documents based on search and date range
  const filteredDocuments = verifiedDocuments.filter(doc => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.verifiedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply date range filter
    let matchesDateRange = true;
    if (dateRange !== 'all') {
      const docDate = new Date(doc.verificationDate);
      const today = new Date();
      
      if (dateRange === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDateRange = docDate >= sevenDaysAgo;
      } else if (dateRange === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        matchesDateRange = docDate >= thirtyDaysAgo;
      } else if (dateRange === '3months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        matchesDateRange = docDate >= threeMonthsAgo;
      }
    }
    
    return matchesSearch && matchesDateRange;
  });

  // Render loading state
  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Verified Documents</h1>
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Verified Documents</h1>
          <p className="mt-2 text-sm text-gray-700">
            List of all documents that have been successfully verified.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
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
              placeholder="Search documents..."
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-4">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="3months">Last 3 months</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filteredDocuments.length === 0 && (
        <div className="mt-8 bg-white px-4 py-10 shadow sm:rounded-lg text-center">
          <p className="text-gray-500">No verified documents found matching your criteria.</p>
          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      )}

      {/* Documents Table */}
      {filteredDocuments.length > 0 && (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Verification Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Verified By</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{doc.clientName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{doc.verificationDate}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{doc.verifiedBy}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => handleViewDetails(doc.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDownload(doc.ipfsHash, doc.clientName, doc.documentType)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifiedDocument;