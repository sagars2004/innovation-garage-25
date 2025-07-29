import React, { useState, useMemo } from 'react';
import { CalendarIcon, ClockIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getPriorityLevel, getPriorityColor, getIntentBreakdown } from '../utils/scoring';

const AppointmentScheduler = ({ customer, onAppointmentScheduled, onBack }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate time slots for the day (9 AM to 6 PM, 30-minute intervals)
  const generateTimeSlots = (date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(date);
        time.setHours(hour, minute, 0, 0);
        
        // Skip if time is in the past for today
        if (date.toDateString() === new Date().toDateString() && time < new Date()) {
          continue;
        }
        
        slots.push(time);
      }
    }
    
    return slots;
  };

  // Calculate priority-adjusted time slots
  const priorityAdjustedSlots = useMemo(() => {
    const baseSlots = generateTimeSlots(selectedDate);
    const customerPriority = getPriorityLevel(customer.score);
    const intentBreakdown = getIntentBreakdown(customer);
    
    // Adjust slots based on priority and intent
    return baseSlots.map(slot => {
      let adjustedScore = 1.0; // Base availability score
      
      // High priority customers get better time slots
      if (customerPriority === 'Critical' || customerPriority === 'High') {
        // Prefer morning slots for high priority (fresher staff, more time)
        const hour = slot.getHours();
        if (hour >= 9 && hour <= 11) adjustedScore += 0.3;
        else if (hour >= 14 && hour <= 16) adjustedScore += 0.2;
        else adjustedScore -= 0.1;
      }
      
      // Purchase intent gets better slots than browsing
      if (intentBreakdown.intentType === 'purchase') {
        adjustedScore += 0.2;
      } else if (intentBreakdown.intentType === 'browsing') {
        adjustedScore -= 0.1;
      }
      
      // Test drive requests need more time
      if (customer.wantsTestDrive) {
        adjustedScore += 0.1;
      }
      
      // Multiple car test drives need even more time
      if (customer.wantsMultipleCars) {
        adjustedScore += 0.2;
      }
      
      // Financing needs get longer slots
      if (customer.needsFinancing) {
        adjustedScore += 0.15;
      }
      
      // Trade-in appraisals need special handling
      if (customer.hasTradeIn && customer.needsAppraisal) {
        adjustedScore += 0.25;
      }
      
      return {
        time: slot,
        availability: Math.min(adjustedScore, 1.0),
        isRecommended: adjustedScore > 1.2,
        isAvailable: adjustedScore > 0.5
      };
    });
  }, [customer, selectedDate]);

  // Group slots by availability level
  const groupedSlots = useMemo(() => {
    const recommended = priorityAdjustedSlots.filter(slot => slot.isRecommended);
    const available = priorityAdjustedSlots.filter(slot => slot.isAvailable && !slot.isRecommended);
    const limited = priorityAdjustedSlots.filter(slot => !slot.isAvailable);
    
    return { recommended, available, limited };
  }, [priorityAdjustedSlots]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleScheduleAppointment = () => {
    if (selectedSlot) {
      onAppointmentScheduled({
        customerId: customer.id,
        customerName: customer.name,
        appointmentTime: selectedSlot.time,
        priority: getPriorityLevel(customer.score),
        intentType: getIntentBreakdown(customer).intentType,
        services: {
          needsFinancing: customer.needsFinancing,
          wantsTestDrive: customer.wantsTestDrive,
          wantsMultipleCars: customer.wantsMultipleCars,
          hasTradeIn: customer.hasTradeIn,
          needsAppraisal: customer.needsAppraisal
        }
      });
    }
  };

  const getSlotColor = (slot) => {
    if (slot.isRecommended) return 'border-green-500 bg-green-50 hover:bg-green-100';
    if (slot.isAvailable) return 'border-blue-300 bg-blue-50 hover:bg-blue-100';
    return 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment</h2>
            <p className="text-gray-600">Select the best time for {customer.name}</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>
        
        {/* Customer Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Customer Info</h3>
            <p className="text-sm text-gray-600">{customer.name}</p>
            <p className="text-xs text-gray-500 mt-1">"{customer.rawInput}"</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(getPriorityLevel(customer.score))}`}>
              {getPriorityLevel(customer.score)}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Score: {(customer.score * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Services Needed</h3>
            <div className="flex flex-wrap gap-1">
              {customer.needsFinancing && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Financing</span>}
              {customer.wantsTestDrive && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Test Drive</span>}
              {customer.wantsMultipleCars && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Multiple Cars</span>}
              {customer.hasTradeIn && <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">Trade-In</span>}
              {customer.needsAppraisal && <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Appraisal</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg border-2 text-center ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Available Time Slots for {formatDate(selectedDate)}
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Recommended</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Limited</span>
            </div>
          </div>
        </div>

        {/* Recommended Slots */}
        {groupedSlots.recommended.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center">
              <CheckIcon className="w-4 h-4 mr-2" />
              Recommended Slots (Best for your priority level)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groupedSlots.recommended.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedSlot?.time === slot.time
                      ? 'border-green-600 bg-green-100 ring-2 ring-green-200'
                      : getSlotColor(slot)
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(slot.time)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(slot.availability * 100).toFixed(0)}% optimal
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Slots */}
        {groupedSlots.available.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              Available Slots
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groupedSlots.available.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedSlot?.time === slot.time
                      ? 'border-blue-600 bg-blue-100 ring-2 ring-blue-200'
                      : getSlotColor(slot)
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(slot.time)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(slot.availability * 100).toFixed(0)}% optimal
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Limited Slots */}
        {groupedSlots.limited.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <XMarkIcon className="w-4 h-4 mr-2" />
              Limited Availability
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groupedSlots.limited.map((slot, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 text-center bg-gray-50 opacity-50"
                >
                  <div className="text-lg font-semibold text-gray-400">
                    {formatTime(slot.time)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Limited availability
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Button */}
      {selectedSlot && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Selected Appointment
              </h3>
              <p className="text-gray-600">
                {formatDate(selectedSlot.time)} at {formatTime(selectedSlot.time)}
              </p>
            </div>
            <button
              onClick={handleScheduleAppointment}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler; 