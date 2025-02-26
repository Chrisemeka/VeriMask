import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Server, Database, Link, Unlink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StatusPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState({
    connected: false,
    latestBlock: 0,
    peerCount: 0,
    gasPrice: 0,
    networkId: '0',
    syncStatus: 'disconnected',
    contracts: {
      identityVerification: {
        address: '0x169B2a4Fb47373aDBf82413AB666a80cA507aEDF',
        status: 'unknown'
      }
    },
    pendingTransactions: 0,
    verifications: {
      pending: 0,
      completed: 0,
      rejected: 0
    }
  });

  // For demo purposes - in production this would connect to your blockchain node
  const fetchBlockchainStatus = async () => {
    setLoading(true);
    try {
      // Get real blockchain data
      const networkInfo = await blockchainService.getNetworkInfo();
      
      // Check if contract is active by calling a simple method
      let contractStatus = 'unknown';
      try {
        await blockchainService.contract.methods.owner().call();
        contractStatus = 'active';
      } catch {
        contractStatus = 'error';
      }
      
      setBlockchainStatus({
        connected: true,
        latestBlock: networkInfo.latestBlock,
        peerCount: networkInfo.peerCount,
        gasPrice: networkInfo.gasPrice,
        networkId: networkInfo.networkId.toString(),
        syncStatus: 'synced',
        contracts: {
          identityVerification: {
            address: blockchainService.contractAddress,
            status: contractStatus
          }
        },
        // You'd need additional API calls to get these statistics
        pendingTransactions: 0,
        verifications: {
          pending: 0,
          completed: 0,
          rejected: 0
        }
      });
      setLoading(false);
    } catch (err) {
      setError("Failed to connect to blockchain node");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchBlockchainStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Manually refresh status
  const handleRefresh = () => {
    fetchBlockchainStatus();
  };

  // Determine network name from ID
  const getNetworkName = (id) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '3': 'Ropsten Testnet',
      '4': 'Rinkeby Testnet',
      '5': 'Goerli Testnet',
      '42': 'Kovan Testnet',
      '1337': 'Local Ganache',
      '31337': 'Hardhat Network'
    };
    
    return networks[id] || `Unknown Network (${id})`;
  };

  // Status indicator component
  const StatusIndicator = ({ status, text }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'active':
        case 'synced':
        case 'connected':
          return 'bg-green-500';
        case 'pending':
        case 'syncing':
          return 'bg-yellow-500';
        case 'disconnected':
        case 'inactive':
        case 'error':
          return 'bg-red-500';
        default:
          return 'bg-gray-500';
      }
    };
    
    return (
      <div className="flex items-center">
        <div className={`h-3 w-3 rounded-full ${getStatusColor()} mr-2`}></div>
        <span>{text || status}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Blockchain Status</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Connecting to blockchain...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Server className="h-5 w-5 mr-2 text-gray-500" />
                Connection Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Status</span>
                  <div className="mt-1">
                    <StatusIndicator status={blockchainStatus.connected ? 'connected' : 'disconnected'} 
                                    text={blockchainStatus.connected ? 'Connected' : 'Disconnected'} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Network</span>
                  <span className="text-lg font-medium">{getNetworkName(blockchainStatus.networkId)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Sync Status</span>
                  <div className="mt-1">
                    <StatusIndicator status={blockchainStatus.syncStatus} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Peers</span>
                  <span className="text-lg font-medium">{blockchainStatus.peerCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Details */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-gray-500" />
                Blockchain Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Latest Block</span>
                  <span className="text-lg font-medium">{blockchainStatus.latestBlock.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Gas Price</span>
                  <span className="text-lg font-medium">{blockchainStatus.gasPrice} Gwei</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Pending Transactions</span>
                  <span className="text-lg font-medium">{blockchainStatus.pendingTransactions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Contract Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Link className="h-5 w-5 mr-2 text-gray-500" />
                Smart Contracts
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        IdentityVerification
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {blockchainStatus.contracts.identityVerification.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <StatusIndicator status={blockchainStatus.contracts.identityVerification.status} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Verification Statistics */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-gray-500" />
                Verification Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-green-100 flex items-center justify-center mr-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="text-2xl font-semibold text-green-900">{blockchainStatus.verifications.completed}</p>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-yellow-100 flex items-center justify-center mr-4">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-semibold text-yellow-900">{blockchainStatus.verifications.pending}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-red-100 flex items-center justify-center mr-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-red-700">Rejected</p>
                    <p className="text-2xl font-semibold text-red-900">{blockchainStatus.verifications.rejected}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  View Contract on Explorer
                </button>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  View Verification Logs
                </button>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Test Contract Connection
                </button>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  View Gas Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPage;