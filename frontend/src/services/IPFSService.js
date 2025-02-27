// src/services/IPFSService.js
import axios from 'axios';

class IPFSService {
  constructor() {
    // Pinata credentials - hardcoded for now
    // In Create React App, env variables should be prefixed with REACT_APP_
    // and accessed via window.env or import.meta.env in Vite
    this.apiKey = 'd138fddd7e7457d6be27'; // Replace with your Pinata API key
    this.apiSecret = 'def6a690a7990307247439ea4af76460525e696eeeb288f23a0078b17b318120'; // Replace with your Pinata API secret
    
    // IPFS gateway for accessing files
    this.gateway = 'https://gateway.pinata.cloud/ipfs/';
  }
  
  async uploadFile(file) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to Pinata
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': this.apiKey,
            'pinata_secret_api_key': this.apiSecret
          }
        }
      );
      
      if (!response.data || !response.data.IpfsHash) {
        throw new Error('Failed to get IPFS hash from Pinata');
      }
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }
  
  getFileUrl(ipfsHash) {
    if (!ipfsHash) return null;
    return `${this.gateway}${ipfsHash}`;
  }
  
  // For direct use with file input events
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return null;
    
    return await this.uploadFile(file);
  }
  
  // Get metadata about an IPFS file (if available)
  async getFileMetadata(ipfsHash) {
    try {
      const response = await axios.get(`${this.gateway}${ipfsHash}?metadata=true`);
      return response.data;
    } catch (error) {
      console.error('Error getting IPFS metadata:', error);
      return null;
    }
  }
}

// Create singleton instance
const ipfsService = new IPFSService();
export default ipfsService;