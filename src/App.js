import React, { useState, useEffect } from 'react';
import CustomerOnboarding from './components/CustomerOnboarding';
import QueueDisplay from './components/QueueDisplay';
import AppointmentScheduler from './components/AppointmentScheduler';
import { calculateScore } from './utils/scoring';

function App() {
  const [customers, setCustomers] = useState([]);
  const [currentView, setCurrentView] = useState('onboarding'); // 'onboarding', 'queue', or 'scheduling'
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);

  // Load sample data on component mount
  useEffect(() => {
    const sampleCustomers = [
      {
        id: 1,
        name: "John Smith",
        rawInput: "I'm looking to buy a new SUV today and wanted to check out options",
        needsAppraisal: false,
        needsFinancing: true,
        wantsTestDrive: true,
        wantsMultipleCars: true,
        hasTradeIn: false,
        urgencyLevel: "high",
        preferredTimeframe: "today",
        score: calculateScore({
          needsAppraisal: false,
          needsFinancing: true,
          wantsTestDrive: true,
          wantsMultipleCars: true,
          hasTradeIn: false,
          urgencyLevel: "high",
          preferredTimeframe: "today"
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        status: "waiting"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        rawInput: "I need to get my oil changed and brakes checked",
        needsAppraisal: false,
        needsFinancing: false,
        wantsTestDrive: false,
        wantsMultipleCars: false,
        hasTradeIn: false,
        urgencyLevel: "medium",
        preferredTimeframe: "this week",
        score: calculateScore({
          needsAppraisal: false,
          needsFinancing: false,
          wantsTestDrive: false,
          wantsMultipleCars: false,
          hasTradeIn: false,
          urgencyLevel: "medium",
          preferredTimeframe: "this week"
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        status: "waiting"
      },
      {
        id: 3,
        name: "Mike Davis",
        rawInput: "Just browsing around, might be interested in trading in my car",
        needsAppraisal: true,
        needsFinancing: false,
        wantsTestDrive: false,
        wantsMultipleCars: false,
        hasTradeIn: true,
        urgencyLevel: "low",
        preferredTimeframe: "this month",
        score: calculateScore({
          needsAppraisal: true,
          needsFinancing: false,
          wantsTestDrive: false,
          wantsMultipleCars: false,
          hasTradeIn: true,
          urgencyLevel: "low",
          preferredTimeframe: "this month"
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        status: "waiting"
      },
      {
        id: 4,
        name: "Lisa Chen",
        rawInput: "I need to buy a car urgently for work, budget around $25k",
        needsAppraisal: false,
        needsFinancing: true,
        wantsTestDrive: true,
        wantsMultipleCars: false,
        hasTradeIn: false,
        urgencyLevel: "high",
        preferredTimeframe: "today",
        score: calculateScore({
          needsAppraisal: false,
          needsFinancing: true,
          wantsTestDrive: true,
          wantsMultipleCars: false,
          hasTradeIn: false,
          urgencyLevel: "high",
          preferredTimeframe: "today"
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        status: "waiting"
      }
    ];
    setCustomers(sampleCustomers);
  }, []);

  const addCustomer = (customerData) => {
    const newCustomer = {
      ...customerData,
      score: calculateScore(customerData),
      createdAt: new Date(),
      status: "waiting"
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleProceedToScheduling = (customerData) => {
    setCurrentCustomer(customerData);
    setCurrentView('scheduling');
  };

  const handleAppointmentScheduled = (appointmentData) => {
    // Add appointment to list
    setAppointments(prev => [...prev, appointmentData]);
    
    // Update customer status
    setCustomers(prev => prev.map(customer => 
      customer.id === appointmentData.customerId 
        ? { ...customer, status: "scheduled" }
        : customer
    ));
    
    // Show success message and return to onboarding
    alert(`Appointment scheduled for ${appointmentData.customerName} at ${appointmentData.appointmentTime.toLocaleString()}`);
    setCurrentView('onboarding');
    setCurrentCustomer(null);
  };

  const handleBackFromScheduling = () => {
    setCurrentView('onboarding');
    setCurrentCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">iQ SmartQueue</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                MVP
              </span>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('onboarding')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'onboarding'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Entry
              </button>
              <button
                onClick={() => setCurrentView('queue')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'queue'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Queue Display
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'onboarding' ? (
          <CustomerOnboarding 
            onCustomerAdded={addCustomer} 
            onProceedToScheduling={handleProceedToScheduling}
          />
        ) : currentView === 'scheduling' ? (
          <AppointmentScheduler 
            customer={currentCustomer}
            onAppointmentScheduled={handleAppointmentScheduled}
            onBack={handleBackFromScheduling}
          />
        ) : (
          <QueueDisplay customers={customers} />
        )}
      </main>

      {/* Appointments Summary */}
      {appointments.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Appointments</h3>
          <div className="space-y-1">
            {appointments.slice(-3).map((appointment, index) => (
              <div key={index} className="text-xs text-gray-600">
                {appointment.customerName} - {appointment.appointmentTime.toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 