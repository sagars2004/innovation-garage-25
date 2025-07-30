import React, { useState, useMemo } from 'react';
import { ClockIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getPriorityLevel, getPriorityColor, getAdjustedScore, getIntentBreakdown } from '../utils/scoring';

const QueueDisplay = ({ customers }) => {
  const [sortBy, setSortBy] = useState('score'); // 'score', 'time', 'name'
  const [filterPriority, setFilterPriority] = useState('all');

  // Calculate adjusted scores with time decay
  const customersWithAdjustedScores = useMemo(() => {
    return customers.map(customer => ({
      ...customer,
      adjustedScore: getAdjustedScore(customer.score, customer.createdAt),
      priorityLevel: getPriorityLevel(customer.score),
      intentBreakdown: getIntentBreakdown(customer)
    }));
  }, [customers]);

  // Apply k-nearest neighbors logic to avoid similar high-priority customers together
  const optimizedQueue = useMemo(() => {
    const sortedByScore = [...customersWithAdjustedScores].sort((a, b) => b.adjustedScore - a.adjustedScore);
    
    // Separate high priority customers (score > 0.6) to avoid clustering
    const highPriority = sortedByScore.filter(c => c.adjustedScore > 0.6);
    const mediumPriority = sortedByScore.filter(c => c.adjustedScore <= 0.6 && c.adjustedScore > 0.3);
    const lowPriority = sortedByScore.filter(c => c.adjustedScore <= 0.3);
    
    // Interleave high priority customers with medium priority to avoid clustering
    const optimized = [];
    let highIndex = 0;
    let mediumIndex = 0;
    
    while (highIndex < highPriority.length || mediumIndex < mediumPriority.length) {
      if (highIndex < highPriority.length) {
        optimized.push(highPriority[highIndex]);
        highIndex++;
      }
      if (mediumIndex < mediumPriority.length) {
        optimized.push(mediumPriority[mediumIndex]);
        mediumIndex++;
      }
    }
    
    // Add low priority customers at the end
    optimized.push(...lowPriority);
    
    return optimized;
  }, [customersWithAdjustedScores]);

  // Filter and sort based on user selection
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = optimizedQueue;
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(customer => customer.priorityLevel === filterPriority);
    }
    
    switch (sortBy) {
      case 'time':
        return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'score':
      default:
        return filtered.sort((a, b) => b.adjustedScore - a.adjustedScore);
    }
  }, [optimizedQueue, sortBy, filterPriority]);

  const formatTimeAgo = (date) => {
    // Ensure date is a Date object (handle both Date objects and date strings)
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Unknown';
    }
    
    const diffInMinutes = Math.floor((now - dateObj) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getIntentIcon = (intentType) => {
    switch (intentType) {
      case 'purchase':
        return '🚗';
      case 'trade-in':
        return '🔄';
      case 'service':
        return '🔧';
      case 'browsing':
        return '👀';
      default:
        return '❓';
    }
  };

  const getTimeAllocationColor = (timeAllocation) => {
    switch (timeAllocation) {
      case 'short':
        return 'text-green-600 bg-green-50';
      case 'standard':
        return 'text-blue-600 bg-blue-50';
      case 'extended':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getBranchingIndicator = (customer) => {
    const indicators = [];
    if (customer.needsFinancing) indicators.push('💰');
    if (customer.willFinalizePaperwork) indicators.push('📄');
    if (customer.wantsWarranty) indicators.push('🛡️');
    if (customer.needsAppraisal) indicators.push('📊');
    return indicators.join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <UserIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customersWithAdjustedScores.filter(c => c.adjustedScore > 0.6).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Average Wait</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const totalWaitTime = customersWithAdjustedScores.reduce((acc, c) => {
                      const dateObj = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
                      if (isNaN(dateObj.getTime())) {
                        return acc;
                      }
                      const waitTime = (new Date() - dateObj) / (1000 * 60);
                      return acc + waitTime;
                    }, 0);
                    const averageWait = customers.length > 0 ? totalWaitTime / customers.length : 0;
                    return `${Math.round(averageWait)}m`;
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Optimized</p>
                <p className="text-2xl font-bold text-gray-900">K-NN</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="score">Priority Score</option>
              <option value="time">Wait Time</option>
              <option value="name">Name</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Very Low">Very Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Smart Queue</h3>
          <p className="text-sm text-gray-500 mt-1">
            Customers sorted by priority with k-nearest neighbors optimization
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intent & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                      {customer.adjustedScore > 0.6 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        "{customer.rawInput}"
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getIntentIcon(customer.intentBreakdown.intentType)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {customer.intentBreakdown.intentType.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getBranchingIndicator(customer)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {customer.intentBreakdown.timeAllocation} time
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(customer.priorityLevel)}`}>
                        {customer.priorityLevel}
                      </span>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTimeAllocationColor(customer.intentBreakdown.timeAllocation)}`}>
                          {customer.intentBreakdown.timeAllocation.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {(customer.adjustedScore * 100).toFixed(0)}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${customer.adjustedScore * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(customer.createdAt)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Waiting
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
            <p className="mt-1 text-sm text-gray-500">
              No customers match the current filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueDisplay; 