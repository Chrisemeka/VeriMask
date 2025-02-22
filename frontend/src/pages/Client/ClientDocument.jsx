// src/pages/client/Documents.jsx
import React, { useState } from 'react';
import { Upload, FileText, Trash2, Eye } from 'lucide-react';
import UploadModal from '../../components/common/UploadModal';

const ClientDocument = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Passport.pdf',
      type: 'Passport',
      status: 'verified',
      uploadDate: '2024-02-20',
      fileSize: '2.5 MB'
    },
    {
      id: 2,
      name: 'DriverLicense.pdf',
      type: 'Driver\'s License',
      status: 'pending',
      uploadDate: '2024-02-19',
      fileSize: '1.8 MB'
    },
    {
      id: 3,
      name: 'BankStatement.pdf',
      type: 'Bank Statement',
      status: 'rejected',
      uploadDate: '2024-02-18',
      fileSize: '3.2 MB'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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

        {/* Document List */}
        <div className="mt-8">
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
                          <span>{document.fileSize}</span>
                          <span className="mx-2">•</span>
                          <span>Uploaded on {document.uploadDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button className="text-gray-400 hover:text-gray-500">
                        {/* <Eye className="h-5 w-5" /> */}
                      </button>
                      <button className="text-red-400 hover:text-red-500">
                        <Trash2 className="h-5 w-5" />
                      </button>
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

export default ClientDocument;