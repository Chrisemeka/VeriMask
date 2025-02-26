import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, Check, AlertTriangle, Link } from 'lucide-react';
import blockchainService from './services/BlockchainIntegration';
import ipfsService from './services/IPFSService';

const TestUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('passport');
  const [uploading, setUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState('');
  const [txHash, setTxHash] = useState('');
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleTypeChange = (e) => {
    setDocumentType(e.target.value);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    
    setUploading(true);
    
    try {
      // Connect wallet
      await blockchainService.connectWallet();
      
      // Upload to IPFS
      const loadingToast = toast.loading('Uploading to IPFS...');
      const hash = await ipfsService.uploadFile(selectedFile);
      setIpfsHash(hash);
      toast.dismiss(loadingToast);
      toast.success('Uploaded to IPFS');
      
      // Upload to blockchain
      const blockchainToast = toast.loading('Recording on blockchain...');
      const tx = await blockchainService.uploadDocument(hash, documentType);
      setTxHash(tx.transactionHash);
      toast.dismiss(blockchainToast);
      toast.success('Document recorded on blockchain');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-6">Test Document Upload</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={documentType}
          onChange={handleTypeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="passport">Passport</option>
          <option value="drivers_license">Driver's License</option>
          <option value="national_id">National ID</option>
          <option value="utility_bill">Utility Bill</option>
          <option value="bank_statement">Bank Statement</option>
        </select>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document File
        </label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
        </div>
      </div>
      
      <button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          uploading || !selectedFile ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {uploading ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 mr-2" />
            Upload Document
          </>
        )}
      </button>
      
      {ipfsHash && (
        <div className="mt-6 p-4 border border-green-200 rounded-md bg-green-50">
          <h3 className="text-lg font-medium flex items-center text-green-800">
            <Check className="h-5 w-5 mr-2" />
            Document Uploaded Successfully
          </h3>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <strong>IPFS Hash:</strong>
              <span className="font-mono text-xs ml-2 break-all">{ipfsHash}</span>
            </p>
            <p className="mt-2">
              <a
                href={ipfsService.getIPFSUrl(ipfsHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Link className="h-4 w-4 mr-1" />
                View on IPFS
              </a>
            </p>
            
            {txHash && (
              <p className="mt-4 text-sm text-gray-600">
                <strong>Transaction Hash:</strong>
                <span className="font-mono text-xs ml-2 break-all">{txHash}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestUpload;