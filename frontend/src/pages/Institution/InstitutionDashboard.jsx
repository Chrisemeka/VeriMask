import React from 'react';
import { Users, FileText, CheckCircle, Clock, AlertCircle, Search, ArrowRight } from 'lucide-react';

const InstitutionDashboard = () => {
  // Example data - replace with real data from your backend
  const verificationStats = {
    totalClients: 150,
    pendingVerifications: 25,
    completedToday: 12,
    rejectedToday: 3
  };

  const pendingVerifications = [
    {
      id: 1,
      clientName: 'John Doe',
      documentType: 'Passport',
      submittedDate: '2024-02-20',
      priority: 'high'
    },
    {
      id: 2,
      clientName: 'Jane Smith',
      documentType: 'Drivers License',
      submittedDate: '2024-02-19',
      priority: 'medium'
    },
    {
      id: 3,
      clientName: 'Mike Johnson',
      documentType: 'Bank Statement',
      submittedDate: '2024-02-18',
      priority: 'low'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'Verification Completed',
      client: 'Sarah Wilson',
      document: 'Passport',
      time: '2 hours ago'
    },
    {
      id: 2,
      action: 'Document Rejected',
      client: 'Alex Brown',
      document: 'Utility Bill',
      time: '3 hours ago'
    },
    {
      id: 3,
      action: 'New Submission',
      client: 'Emily Davis',
      document: 'Bank Statement',
      time: '5 hours ago'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Verification Completed': return 'text-green-600';
      case 'Document Rejected': return 'text-red-600';
      case 'New Submission': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Institution Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                    <dd className="text-lg font-semibold text-gray-900">{verificationStats.totalClients}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Verifications</dt>
                    <dd className="text-lg font-semibold text-gray-900">{verificationStats.pendingVerifications}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                    <dd className="text-lg font-semibold text-gray-900">{verificationStats.completedToday}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected Today</dt>
                    <dd className="text-lg font-semibold text-gray-900">{verificationStats.rejectedToday}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0 md:mr-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search for clients or documents..."
                />
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option>All Status</option>
                <option>Pending</option>
                <option>Verified</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Pending Verifications */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Pending Verifications</h2>
              <button className="text-sm text-blue-600 hover:text-blue-500">View all</button>
            </div>
            <ul className="divide-y divide-gray-200">
              {pendingVerifications.map((verification) => (
                <li key={verification.id} className="px-4 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">{verification.clientName}</p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(verification.priority)}`}>
                          {verification.priority}
                        </span>
                      </div>
                      <div className="mt-2 flex">
                        <p className="text-sm text-gray-500">{verification.documentType}</p>
                        <p className="ml-2 text-sm text-gray-500">• {verification.submittedDate}</p>
                      </div>
                    </div>
                    <button className="ml-4 flex-shrink-0 text-sm text-blue-600 hover:text-blue-500">
                      Verify <ArrowRight className="inline-block h-4 w-4 ml-1" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-500">View all</button>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="px-4 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </p>
                      <div className="mt-2 flex">
                        <p className="text-sm text-gray-500">{activity.client}</p>
                        <p className="ml-2 text-sm text-gray-500">• {activity.document}</p>
                        <p className="ml-2 text-sm text-gray-500">• {activity.time}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;