import React from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const AppointmentConfirmationModal = ({ isOpen, onClose, appointmentData }) => {
  if (!isOpen || !appointmentData) return null;

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">Appointment Confirmed!</h3>
              <p className="text-sm text-gray-500">Your appointment has been scheduled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center space-x-3">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{appointmentData.customerName}</p>
                <p className="text-xs text-gray-500">Customer</p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(appointmentData.appointmentTime)}
                </p>
                <p className="text-xs text-gray-500">{formatDate(appointmentData.appointmentTime)}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm font-medium text-gray-900">{appointmentData.duration} minutes</span>
              </div>
            </div>

            {/* Service Type */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Service Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {appointmentData.intentType?.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Visit Reason */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Visit Reason</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {appointmentData.visitReason?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmationModal; 