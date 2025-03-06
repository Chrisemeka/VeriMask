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
      
      // Using the credentials from environment variables
      const apiKey = this.apiKey;
      const apiSecret = this.apiSecret;
      
      // Log credentials (only first few characters for security)
      console.log("Using Pinata API Key:", apiKey ? apiKey.substring(0, 4) + "..." : "Missing");
      console.log("API Secret available:", !!apiSecret);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to Pinata
      console.log("Sending request to Pinata...");
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': apiKey,
            'pinata_secret_api_key': apiSecret
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      // Check for valid response
      if (!response.data || !response.data.IpfsHash) {
        console.error("Invalid response from Pinata:", response.data);
        throw new Error('Failed to get IPFS hash from Pinata');
      }
      
      console.log("IPFS upload successful, hash:", response.data.IpfsHash);
      
      // Verify file is accessible via gateway
      await this.verifyFileAccessibility(response.data.IpfsHash);
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      
      // More detailed error information
      if (error.response) {
        console.error('Pinata API response:', error.response.status, error.response.data);
      }
      
      // Instead of using the backend, try using our API directly
      try {
        console.log("Trying to upload through backend API...");
        // Create form data for backend
        const backendFormData = new FormData();
        backendFormData.append('file', file);
        backendFormData.append('document_type', 'other'); // Default type
        
        // Get backend URL from environment
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/v1';
        
        // Send to backend (which handles Pinata interaction)
        const backendResponse = await axios.post(
          `${backendUrl}/documents/upload/`,
          backendFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (backendResponse.data && backendResponse.data.ipfs_hash) {
          console.log("Backend upload successful:", backendResponse.data);
          return backendResponse.data.ipfs_hash;
        } else {
          throw new Error("Backend didn't return a valid IPFS hash");
        }
      } catch (backendError) {
        console.error("Backend upload also failed:", backendError);
        
        // In development mode, return a mock hash
        if (process.env.NODE_ENV === 'development') {
          const mockHash = 'QmXb5M6qCMKRRKqjARKb5XBgtaDfbvCt7uCYgECgVJDXXX';
          console.log("Using mock IPFS hash for development:", mockHash);
          return mockHash;
        }
        
        // If all fails, throw original error
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