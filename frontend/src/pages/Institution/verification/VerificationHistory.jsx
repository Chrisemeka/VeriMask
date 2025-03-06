// src/pages/institution/verification/VerificationHistory.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Calendar, Download, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import AuthService from '../../../services/AuthService';
import { useWallet } from '../../../contexts/WalletContext';

const VerificationHistory = () => {
  const navigate = useNavigate();
  const { wallet, connectWallet } = useWallet();
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all'
  });

  // Load verification history on component mount
  useEffect(() => {
    const initializeAndLoadData = async () => {
      setLoading(true);
      
      // Try to connect wallet if not already connected
      if (!wallet) {
        try {
          await connectWallet();
        } catch (walletError) {
          console.warn("Wallet connection error:", walletError);
          // Continue anyway to load history
        }
      }
      
      // Fetch verification history from backend
      await loadVerificationHistory();
    };
    
    initializeAndLoadData();
  }, [wallet]);

  // Load verification history from backend
  const loadVerificationHistory = async () => {
    try {
      const token = AuthService.getToken();
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      // Get all documents and filter for verified/rejected ones
      const response = await axios.get(`${backendUrl}/documents/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Filter for documents that have been verified or rejected
      const verifiedDocuments = response.data.filter(doc => 
        doc.status === 'Verified' || doc.status === 'Rejected'
      );
      
      // Process the documents to add calculated fields
      const historyItems = verifiedDocuments.map(doc => ({
        id: doc.id,
        clientName: doc.user?.username || 'Unknown Client',
        documentType: doc.document_type,
        verificationDate: new Date(doc.verification_date || doc.upload_date).toLocaleDateString(),
        verifiedBy: doc.verified_by?.username || 'Unknown Verifier',
        status: doc.status.toLowerCase() === 'verified' ? 'approved' : doc.status.toLowerCase(),
        notes: doc.notes || '',
        documentId: doc.id,
        timeElapsed: calculateTimeElapsed(doc.verification_date || doc.upload_date),
        documentHash: doc.ipfs_hash
      }));
      
      setVerificationHistory(historyItems);
      setLoading(false);
    } catch (err) {
      console.error("Error loading verification history:", err);
      setError("Failed to load verification history. Please try again later.");
      
      // In development, use mock data if backend request fails
      if (process.env.NODE_ENV === 'development') {
        console.log("Using mock data in development mode");
        const mockHistory = [
          {
            id: 1,
            clientName: 'John Doe',
            documentType: 'Passport',
            verificationDate: '2025-03-01',
            verifiedBy: 'Sarah Johnson',
            status: 'approved',
            notes: 'All requirements met',
            documentId: 'PASS-2025-001',
            timeElapsed: '2 days ago'
          },
          {
            id: 2,
            clientName: 'Jane Smith',
            documentType: 'Driver\'s License',
            verificationDate: '2025-02-28',
            verifiedBy: 'Mike Wilson',
            status: 'rejected',
            notes: 'Document expired',
            documentId: 'DL-2025-002',
            timeElapsed: '3 days ago'
          }
        ];
        
        setVerificationHistory(mockHistory);
        setLoading(false);
      }
    }
  };

  // Calculate time elapsed since verification
  const calculateTimeElapsed = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const verificationTime = new Date(timestamp);
    const currentTime = new Date();
    const diffInMs = currentTime - verificationTime;
    
    // Convert to appropriate units
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      const hours = Math.round(diffInHours);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 30) {
      const days = Math.round(diffInDays);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      const months = Math.round(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };

  // Get status badge for each verification record
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // View document details
  const handleViewDetails = (id) => {
    navigate(`/institution/verification/${id}`);
  };

  // Export verification history
  const handleExport = () => {
    // Create CSV content
    const headers = ["Client", "Document Type", "Status", "Verified By", "Date", "Notes"];
    
    const csvContent = [
      headers.join(','),
      ...verificationHistory.map(record => [
        `"${record.clientName}"`,
        `"${record.documentType}"`,
        `"${record.status}"`,
        `"${record.verifiedBy}"`,
        `"${record.verificationDate}"`,
        `"${record.notes.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `verification-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Verification history exported successfully');
  };

  // Apply filters to verification history
  const filteredHistory = verificationHistory.filter(record => {
    // Search filter
    const matchesSearch = filters.search === '' || 
      record.clientName.toLowerCase().includes(filters.search.toLowerCase()) || 
      record.documentType.toLowerCase().includes(filters.search.toLowerCase());
      
    // Status filter
    const matchesStatus = filters.status === 'all' || record.status === filters.status;
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange !== 'all') {
      const recordDate = new Date(record.verificationDate);
      const now = new Date();
      
      if (filters.dateRange === 'today') {
        matchesDateRange = recordDate.toDateString() === now.toDateString();
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        matchesDateRange = recordDate >= weekAgo;
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDateRange = recordDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Render loading state
  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Verification History</h1>
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
      {/* Header Section */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Verification History</h1>
          <p className="mt-2 text-sm text-gray-700">
            Complete history of all document verifications performed by your institution.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button 
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export History
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search verifications..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Verification History Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {filteredHistory.length === 0 ? (
                <div className="bg-white py-6 px-4 text-center">
                  <p className="text-gray-500">No verification records match your criteria.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Document Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Verified By</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Time</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {record.clientName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.verifiedBy}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.timeElapsed}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleViewDetails(record.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
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

export default VerificationHistory;

  // return (
  //   /* The above code is a snippet of JSX code written in JavaScript React. It represents a section of
  //   a web page layout, specifically the header section. Here's a breakdown of what the code is
  //   doing: */
  //   <div className="px-4 sm:px-6 lg:px-8">
  //     {/* Header Section */}
  //     <div className="sm:flex sm:items-center">
  //       <div className="sm:flex-auto">
  //         <h1 className="text-xl font-semibold text-gray-900">Verification History</h1>
  //         <p className="mt-2 text-sm text-gray-700">
  //           Complete history of all document verifications performed by your institution.
  //         </p>
  //       </div>
  //       <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
  //         <button 
  //           onClick={handleExport}
  //           className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-