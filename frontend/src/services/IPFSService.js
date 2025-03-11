// src/services/IPFSService.js
import axios from 'axios';

class IPFSService {
  constructor() {
    // Pinata credentials from environment variables
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY;
    this.apiSecret = import.meta.env.VITE_PINATA_API_SECRET;
    
    // Multiple IPFS gateways for reliability
    this.gateways = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    
    // Log initialization
    console.log("IPFS Service initialized");
  }
  
  async uploadFile(file) {
    try {
      console.log("Starting IPFS upload for file:", file.name);
      
      // Using a direct API endpoint to avoid CORS issues
      const formData = new FormData();
      formData.append('file', file);
      
      // Try to upload using the backend proxy endpoint to avoid CORS
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const uploadUrl = `${backendUrl}/ipfs/upload/`; // This endpoint should proxy to Pinata
      
      console.log("Uploading to IPFS via backend proxy:", uploadUrl);
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.ipfsHash) {
        console.log("IPFS upload successful, hash:", response.data.ipfsHash);
        return response.data.ipfsHash;
      }
      
      throw new Error("Invalid response format from IPFS upload");
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      
      // Try a different approach without using Pinata directly
      try {
        // Create form data for document upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'other'); // Default type
        
        // Get token for authentication
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        
        if (!token) {
          throw new Error("Authentication required for document upload");
        }
        
        // Get backend URL from environment
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        console.log("Uploading directly to document endpoint:", `${backendUrl}/documents/upload/`);
        
        // Send to document upload endpoint which should handle IPFS internally
        const response = await axios.post(
          `${backendUrl}/documents/upload/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data && response.data.ipfs_hash) {
          console.log("Document upload with IPFS successful:", response.data.ipfs_hash);
          return response.data.ipfs_hash;
        } else {
          throw new Error("No IPFS hash in response");
        }
      } catch (uploadError) {
        console.error("All upload methods failed:", uploadError);
        throw new Error(`IPFS upload failed: ${error.message}`);
      }
    }
  }
  
  // Verify file is accessible via an IPFS gateway
  async verifyFileAccessibility(ipfsHash) {
    const gateway = this.gateways[0]; // Use Pinata gateway by default
    const url = `${gateway}${ipfsHash}`;
    
    try {
      // Try a HEAD request to see if the file is accessible
      const response = await axios.head(url, { timeout: 5000 });
      console.log(`IPFS file verified accessible at ${url}`, response.status);
      return true;
    } catch (error) {
      console.warn(`IPFS file not immediately accessible at ${url}, may take time to propagate.`);
      return false;
    }
  }
  
  getFileUrl(ipfsHash) {
    if (!ipfsHash) return null;
    
    // Try different gateways based on accessibility
    for (const gateway of this.gateways) {
      try {
        return `${gateway}${ipfsHash}`;
      } catch (error) {
        continue;
      }
    }
    
    // Default to Pinata gateway
    return `${this.gateways[0]}${ipfsHash}`;
  }
  
  // Helper method to test connectivity with Pinata
  async testConnection() {
    try {
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret
        }
      });
      
      console.log("Pinata connection test:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Pinata connection test failed:", error);
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }
  
  // Get alternative gateway URLs for a hash
  getAllGateways(ipfsHash) {
    if (!ipfsHash) return [];
    
    return this.gateways.map(gateway => ({
      name: gateway.split('/')[2], // Extract domain name
      url: `${gateway}${ipfsHash}`
    }));
  }
}

// Create singleton instance
const ipfsService = new IPFSService();
export default ipfsService;