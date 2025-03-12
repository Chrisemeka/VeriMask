// src/pages/institution/verifications/VerifiedDocument.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import AuthService from '../../../services/AuthService';

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
      
      if (response.data) {
        // Filter for verified documents only
        const verified = response.data.filter(doc => doc.status === 'Verified');
        
        // Process the documents to add calculated fields
        const verifiedDocs = verified.map(doc => ({
          id: doc.id,
          clientName: doc.user?.username || 'Unknown Client',
          documentType: doc.document_type,
          verificationDate: doc.verification_date ? new Date(doc.verification_date).toLocaleDateString() : 'Unknown',
          verifiedBy: doc.verified_by?.username || 'Unknown',
          status: 'approved'
        }));
        
        setVerifiedDocuments(verifiedDocs);
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
            documentType: 'Passport',
            verificationDate: '2024-02-22',
            verifiedBy: 'Sarah Johnson',
            status: 'approved'
          },
          {
            id: 2,
            clientName: 'Jane Smith',
            documentType: 'Driver\'s License',
            verificationDate: '2024-02-21',
            verifiedBy: 'Mike Wilson',
            status: 'approved'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Verified Documents</h1>
          <p className="mt-2 text-sm text-gray-700">
            List of all documents that have been successfully verified.
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0 sm:mr-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search documents..."
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-4">
          <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>All time</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="h-5 w-5 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Documents Table */}
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
                  {verifiedDocuments.map((doc) => (
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
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-5 w-5" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
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
    </div>
  );
};

export default VerifiedDocument;