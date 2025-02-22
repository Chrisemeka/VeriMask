// src/pages/client/Dashboard.jsx
import React, { useState } from 'react';
import { FileText, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../../components/common/UploadModal';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Example data - replace with real data from your backend
  const documentStats = {
    total: 12,
    verified: 5,
    pending: 4,
    rejected: 3
  };

  const recentDocuments = [
    { id: 1, name: 'Passport.pdf', status: 'verified', date: '2024-02-20' },
    { id: 2, name: 'DriversLicense.pdf', status: 'pending', date: '2024-02-19' },
    { id: 3, name: 'BankStatement.pdf', status: 'rejected', date: '2024-02-18' }
  ];

  function handleViewAllDocuments() {
    navigate('/client/documents');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="mt-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Documents</dt>
                    <dd className="text-lg font-semibold text-gray-900">{documentStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload New Document
            </button>
            <button 
              className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200" 
              onClick={handleViewAllDocuments}
            >
              <FileText className="h-5 w-5 mr-2" />
              View All Documents
            </button>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recentDocuments.map((document) => (
                <li key={document.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="truncate">
                        <div className="flex text-sm">
                          <p className="font-medium text-blue-600 truncate">{document.name}</p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <p>Uploaded on {document.date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};

export default ClientDashboard;