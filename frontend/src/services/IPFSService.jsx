// src/services/IPFSService.js
import axios from 'axios';

class IPFSService {
  constructor() {
    // Pinata credentials - replace with your own
    this.apiKey = 'd138fddd7e7457d6be27';
    this.apiSecret = 'def6a690a7990307247439ea4af76460525e696eeeb288f23a0078b17b318120';
    
    // Gateway for accessing content
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
      
      console.log('Pinata upload response:', response.data);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }
  
  // Get URL for an IPFS hash
  getIPFSUrl(hash) {
    return `${this.gateway}${hash}`;
  }
}

const ipfsService = new IPFSService();
export default ipfsService;