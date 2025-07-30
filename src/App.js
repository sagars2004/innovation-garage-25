import React, { useState, useEffect } from 'react';
import CustomerOnboarding from './components/CustomerOnboarding';
import QueueDisplay from './components/QueueDisplay';
import AppointmentScheduler from './components/AppointmentScheduler';
import { calculateScore } from './utils/scoring';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [customers, setCustomers] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const addCustomer = async (customerData) => {
    try {
      const newCustomer = {
        ...customerData,
        score: calculateScore(customerData)
      };

      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        throw new Error('Failed to add customer');
      }

      const addedCustomer = await response.json();
      console.log('Customer added successfully:', addedCustomer);
      
      // Refresh the customers list
      await fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleProceedToScheduling = (customerData) => {
    setCurrentCustomer(customerData);
    navigate('/scheduling');
  };

  const handleAppointmentScheduled = async (appointmentData) => {
    try {
      // Add appointment to list
      setAppointments(prev => [...prev, appointmentData]);
      
      // Update customer status in database
      const response = await fetch(`${API_BASE_URL}/customers/${appointmentData.customerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'scheduled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer status');
      }

      // Refresh customers list
      await fetchCustomers();
      
      // Show success message and return to onboarding
      alert(`Appointment scheduled for ${appointmentData.customerName} at ${appointmentData.appointmentTime.toLocaleString()}`);
      navigate('/customer-entry');
      setCurrentCustomer(null);
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  const handleBackFromScheduling = () => {
    navigate('/customer-entry');
    setCurrentCustomer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Team Queue-Doba: iQ Prototype</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                MVP
              </span>
            </div>
            <nav className="flex space-x-4">
              {/*
              <button
                onClick={() => navigate('/customer-entry')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/customer-entry'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Entry
              </button>
              <button
                onClick={() => navigate('/queue-display')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/queue-display'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Queue Display
              </button>
              */}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/customer-entry" element={
            <CustomerOnboarding 
              onCustomerAdded={addCustomer} 
              onProceedToScheduling={handleProceedToScheduling}
            />
          } />
          <Route path="/queue-display" element={
            <QueueDisplay customers={customers} />
          } />
          <Route path="/scheduling" element={
            <AppointmentScheduler 
              customer={currentCustomer}
              onAppointmentScheduled={handleAppointmentScheduled}
              onBack={handleBackFromScheduling}
            />
          } />
          <Route path="/" element={<Navigate to="/customer-entry" replace />} />
        </Routes>
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