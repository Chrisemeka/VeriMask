// src/pages/institution/verifications/VerificationDocument.jsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Download, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerificationDocument = () => {
  const navigate = useNavigate();
  const [document, setDocument] = useState({
    id: '123',
    clientName: 'John Doe',
    documentType: 'Passport',
    submissionDate: '2024-02-22',
    status: 'in_review',
    imageUrl: '/sample-document.jpg',
    verificationNotes: '',
    requirements: [
      { id: 1, text: 'Document must be valid', checked: true },
      { id: 2, text: 'All information must be clearly visible', checked: false },
      { id: 3, text: 'No signs of tampering', checked: true },
      { id: 4, text: 'Document not expired', checked: true },
      { id: 5, text: 'Photo matches client description', checked: false },
      { id: 6, text: 'Security features verified', checked: true }
    ]
  });

  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerification = async (action) => {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Handle verification logic here
      console.log(`Document ${action}:`, {
        documentId: document.id,
        action,
        notes: verificationNotes,
        requirements: document.requirements
      });

      // Navigate back after successful verification
      navigate('/institution/verifications');
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={!areAllRequirementsMet || isSubmitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                areAllRequirementsMet && !isSubmitting
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve
            </button>
            <button
              onClick={() => handleVerification('reject')}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Document Preview Section */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h2>
                {/* Document Display */}
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <div className="aspect-w-3 aspect-h-4">
                    <img
                      src={document.imageUrl}
                      alt="Document Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                {/* Download Button */}
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-5 w-5 mr-2" />
                  Download Original
                </button>
              </div>
            </div>

            {/* Document Information */}
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Document Information</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Client Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.clientName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.submissionDate}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{document.status}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Verification Section */}
          <div>
            {/* Requirements Checklist */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Requirements</h2>
                <div className="space-y-4">
                  {document.requirements.map((req) => (
                    <div key={req.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={req.checked}
                        onChange={() => handleRequirementToggle(req.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-3 text-sm text-gray-700">{req.text}</label>
                    </div>
                  ))}
                </div>
                {!areAllRequirementsMet && (
                  <div className="mt-4 flex items-center text-sm text-yellow-600">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    All requirements must be met before approval
                  </div>
                )}
              </div>
            </div>

            {/* Verification Notes */}
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Verification Notes
                  </div>
                </h2>
                <textarea
                  rows={6}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about the verification process..."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDocument;