// src/pages/institution/Clients.jsx
import React, { useState } from 'react';
import { Search, Filter, User, FileText, ChevronRight } from 'lucide-react';

const Clients = () => {
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      totalDocuments: 5,
      verifiedDocuments: 3,
      pendingDocuments: 2,
      lastActivity: '2024-02-22',
      status: 'active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      totalDocuments: 3,
      verifiedDocuments: 2,
      pendingDocuments: 1,
      lastActivity: '2024-02-21',
      status: 'active'
    },
    {
      id: 3,
      name: 'Robert Brown',
      email: 'robert.brown@example.com',
      totalDocuments: 4,
      verifiedDocuments: 4,
      pendingDocuments: 0,
      lastActivity: '2024-02-20',
      status: 'inactive'
    }
  ]);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    documentsStatus: 'all'
  });

  const handleViewClient = (clientId) => {
    // Navigate to client details page
    console.log('Viewing client:', clientId);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all clients and their document verification status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search clients..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.documentsStatus}
          onChange={(e) => setFilters({ ...filters, documentsStatus: e.target.value })}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Documents</option>
          <option value="pending">Has Pending Documents</option>
          <option value="verified">All Verified</option>
        </select>
      </div>

      {/* Clients List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="divide-y divide-gray-200 bg-white">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewClient(client.id)}
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-600">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-8">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {client.verifiedDocuments}/{client.totalDocuments} Verified
                              </span>
                            </div>
                            {client.pendingDocuments > 0 && (
                              <span className="text-sm text-yellow-600">
                                {client.pendingDocuments} Pending
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {client.status}
                            </span>
                            <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Last active: {client.lastActivity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;