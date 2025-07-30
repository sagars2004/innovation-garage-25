import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline';

const AppointmentScheduler = ({ customer, onAppointmentScheduled, onBack }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [existingAppointments, setExistingAppointments] = useState([]);

  // Generate today's time slots
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    
    return slots;
  };

  // Calculate appointment duration based on time allocation
  const getAppointmentDuration = (timeAllocation) => {
    switch (timeAllocation) {
      case 'short':
        return 20; // 20 minutes
      case 'standard':
        return 45; // 45 minutes
      case 'extended':
        return 90; // 90 minutes
      default:
        return 30;
    }
  };

  // Check if time slot conflicts with existing appointments
  const hasConflict = (startTime, duration) => {
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    return existingAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.time);
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
      
      return (startTime < appointmentEnd && endTime > appointmentStart);
    });
  };

  // Apply k-nearest neighbors logic to avoid clustering similar customers
  const getAdjustedTimeSlots = () => {
    const allSlots = generateTimeSlots();
    const duration = getAppointmentDuration(customer.timeAllocation);
    const availableSlots = allSlots.filter(slot => !hasConflict(slot, duration));
    
    // Separate slots by time of day
    const morningSlots = availableSlots.filter(slot => slot.getHours() < 12);
    const afternoonSlots = availableSlots.filter(slot => slot.getHours() >= 12);
    
    // If customer has high priority (extended time), avoid clustering with other extended appointments
    if (customer.timeAllocation === 'extended') {
      const extendedAppointments = existingAppointments.filter(apt => apt.duration >= 90);
      
      // Prefer morning slots if there are many afternoon extended appointments
      if (extendedAppointments.filter(apt => apt.time.getHours() >= 12).length > 2) {
        return morningSlots.length > 0 ? morningSlots : afternoonSlots;
      }
      
      // Prefer afternoon slots if there are many morning extended appointments
      if (extendedAppointments.filter(apt => apt.time.getHours() < 12).length > 2) {
        return afternoonSlots.length > 0 ? afternoonSlots : morningSlots;
      }
    }
    
    // For standard priority, prefer balanced distribution
    if (customer.timeAllocation === 'standard') {
      const standardAppointments = existingAppointments.filter(apt => apt.duration >= 30 && apt.duration < 90);
      
      if (standardAppointments.filter(apt => apt.time.getHours() < 12).length > 
          standardAppointments.filter(apt => apt.time.getHours() >= 12).length) {
        return afternoonSlots.length > 0 ? afternoonSlots : morningSlots;
      } else {
        return morningSlots.length > 0 ? morningSlots : afternoonSlots;
      }
    }
    
    // For short appointments, prefer gaps between longer appointments
    if (customer.timeAllocation === 'short') {
      const longAppointments = existingAppointments.filter(apt => apt.duration >= 45);
      const gaps = availableSlots.filter(slot => {
        const slotEnd = new Date(slot.getTime() + duration * 60000);
        return longAppointments.some(apt => {
          const aptStart = new Date(apt.time);
          const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
          return (slot < aptStart && slotEnd <= aptStart) || (slot >= aptEnd);
        });
      });
      
      return gaps.length > 0 ? gaps : availableSlots;
    }
    
    return availableSlots;
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeSlotColor = (timeAllocation) => {
    switch (timeAllocation) {
      case 'short':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'standard':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'extended':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleScheduleAppointment = () => {
    if (selectedTime) {
      const appointmentData = {
        customerId: customer.id,
        customerName: customer.name,
        appointmentTime: selectedTime,
        duration: getAppointmentDuration(customer.timeAllocation),
        timeAllocation: customer.timeAllocation,
        intentType: customer.intentType,
        visitReason: customer.visitReason
      };
      
      onAppointmentScheduled(appointmentData);
    }
  };

  // Load sample existing appointments
  useEffect(() => {
    const sampleAppointments = [
      {
        customerName: "John Smith",
        time: new Date(new Date().setHours(10, 0, 0, 0)),
        duration: 90,
        timeAllocation: "extended"
      },
      {
        customerName: "Sarah Johnson",
        time: new Date(new Date().setHours(11, 30, 0, 0)),
        duration: 45,
        timeAllocation: "standard"
      },
      {
        customerName: "Mike Davis",
        time: new Date(new Date().setHours(14, 0, 0, 0)),
        duration: 20,
        timeAllocation: "short"
      },
      {
        customerName: "Lisa Chen",
        time: new Date(new Date().setHours(15, 30, 0, 0)),
        duration: 90,
        timeAllocation: "extended"
      }
    ];
    setExistingAppointments(sampleAppointments);
  }, []);

  const adjustedTimeSlots = getAdjustedTimeSlots();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment</h2>
            <p className="text-gray-600 mt-1">Select a time slot for {customer.name}</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Customer Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-600">{customer.visitReason?.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getTimeSlotColor(customer.timeAllocation)}`}>
              {customer.timeAllocation?.toUpperCase()} TIME
            </span>
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {customer.intentType?.replace('-', ' ').toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Appointment Details */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Duration:</span>
            <span className="ml-2 text-gray-900">{getAppointmentDuration(customer.timeAllocation)} minutes</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Visit Reason:</span>
            <span className="ml-2 text-gray-900">{customer.visitReason?.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Priority:</span>
            <span className="ml-2 text-gray-900">{customer.intentType?.replace('-', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Time Slots</h3>
          <p className="text-sm text-gray-500 mt-1">
            Optimized to avoid clustering similar appointment types
          </p>
        </div>
        
        <div className="p-6">
          {adjustedTimeSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adjustedTimeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTime(slot)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedTime?.getTime() === slot.getTime()
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatTime(slot)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {getAppointmentDuration(customer.timeAllocation)} min appointment
                      </div>
                    </div>
                    {selectedTime?.getTime() === slot.getTime() && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No available slots</h3>
              <p className="mt-1 text-sm text-gray-500">
                All time slots are currently booked for today.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Button */}
      {selectedTime && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleScheduleAppointment}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Schedule for {formatTime(selectedTime)}</span>
          </button>
        </div>
      )}

      {/* Existing Appointments Preview */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Today's Schedule</h4>
        <div className="space-y-2">
          {existingAppointments.map((appointment, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <span className="text-gray-500">{formatTime(appointment.time)}</span>
                <span className="font-medium text-gray-900">{appointment.customerName}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getTimeSlotColor(appointment.timeAllocation)}`}>
                {appointment.duration}min
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler; 