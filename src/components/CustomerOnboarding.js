import React, { useState } from 'react';
import { CheckIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const CustomerOnboarding = ({ onCustomerAdded, onProceedToScheduling }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    rawInput: '',
    visitReason: '', // Q1: A, B, C, or D
    needsFinancing: null, // Q2: Only if Q1 = A
    willFinalizePaperwork: null, // Q3: If Q1 = A or B, or Q2 = Yes
    needsAppraisal: null, // Q4: Only if Q1 = C
    wantsWarranty: null, // Q5: Yes/No
    urgencyLevel: '',
    preferredTimeframe: ''
  });

  const steps = [
    {
      id: 0,
      title: "Welcome",
      question: "What's your name?",
      field: "name",
      type: "text",
      placeholder: "Enter your full name"
    },
    {
      id: 1,
      title: "Your Visit",
      question: "What brings you in today?",
      field: "visitReason",
      type: "select",
      options: [
        { value: "test_drive", label: "I want to test drive a vehicle", description: "Experience the vehicle before making a decision" },
        { value: "purchase", label: "I'm ready to purchase a vehicle", description: "Looking to buy today" },
        { value: "trade_in", label: "I want to sell or trade in my vehicle", description: "Selling or trading in your current vehicle" },
        { value: "browsing", label: "I'm just browsing", description: "Just looking around today" }
      ]
    },
    {
      id: 2,
      title: "Financing",
      question: "Are you interested in financing options?",
      field: "needsFinancing",
      type: "yesno",
      description: "We offer competitive financing options",
      conditional: (data) => data.visitReason === "test_drive"
    },
    {
      id: 3,
      title: "Paperwork",
      question: "Will you be finalizing paperwork during this visit?",
      field: "willFinalizePaperwork",
      type: "yesno",
      description: "Completing purchase or financing paperwork",
      conditional: (data) => 
        data.visitReason === "test_drive" || 
        data.visitReason === "purchase" || 
        data.needsFinancing === true
    },
    {
      id: 4,
      title: "Appraisal",
      question: "Do you need a vehicle appraisal?",
      field: "needsAppraisal",
      type: "yesno",
      description: "We can evaluate your current vehicle's trade-in value",
      conditional: (data) => data.visitReason === "trade_in"
    },
    {
      id: 5,
      title: "Warranty",
      question: "Are you interested in adding a warranty or protection plan?",
      field: "wantsWarranty",
      type: "yesno",
      description: "Protect your investment with extended coverage"
    },
    {
      id: 6,
      title: "Urgency",
      question: "How urgent is your need?",
      field: "urgencyLevel",
      type: "select",
      options: [
        { value: "high", label: "Very urgent", description: "Need immediate assistance today" },
        { value: "medium", label: "Somewhat urgent", description: "Would like to handle this soon" },
        { value: "low", label: "Not urgent", description: "Just exploring options" }
      ]
    },
    {
      id: 7,
      title: "Timeline",
      question: "What's your preferred timeframe?",
      field: "preferredTimeframe",
      type: "select",
      options: [
        { value: "today", label: "Today", description: "Need to complete this today" },
        { value: "this week", label: "This week", description: "Within the next few days" },
        { value: "this month", label: "This month", description: "Within the next few weeks" },
        { value: "no rush", label: "No rush", description: "Just exploring, no specific timeline" }
      ]
    }
  ];

  // Filter steps based on conditional logic
  const filteredSteps = steps.filter((step, index) => {
    if (step.conditional) {
      return step.conditional(formData);
    }
    return true;
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate intent type and time allocation based on answers
      const intentType = calculateIntentType(formData);
      const timeAllocation = calculateTimeAllocation(formData);
      
      // Create customer data
      const customerData = {
        ...formData,
        intentType,
        timeAllocation,
        id: Date.now(),
        score: 0 // Will be calculated in the parent component
      };
      
      // Add customer to queue
      onCustomerAdded(customerData);
      
      // Proceed to scheduling
      onProceedToScheduling(customerData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const currentField = filteredSteps[currentStep].field;
    return formData[currentField] !== null && formData[currentField] !== '';
  };

  // Calculate intent type based on branching answers
  const calculateIntentType = (data) => {
    const { visitReason, needsFinancing, willFinalizePaperwork, needsAppraisal, wantsWarranty } = data;

    if (visitReason === "purchase") {
      return "purchase";
    } else if (visitReason === "trade_in") {
      return "trade-in";
    } else if (visitReason === "test_drive") {
      if (needsFinancing === true || willFinalizePaperwork === true) {
        return "purchase";
      } else {
        return "browsing";
      }
    } else if (visitReason === "browsing") {
      return "browsing";
    }
    
    return "other";
  };

  // Calculate time allocation based on answers
  const calculateTimeAllocation = (data) => {
    const { visitReason, needsFinancing, willFinalizePaperwork, needsAppraisal, wantsWarranty } = data;

    // Short (15-20 min): Just browsing, no financing, no paperwork
    if (visitReason === "browsing" && 
        needsFinancing !== true && 
        willFinalizePaperwork !== true) {
      return "short";
    }

    // Extended (60-90+ min): Financing, paperwork, warranty discussions
    if (needsFinancing === true || 
        willFinalizePaperwork === true || 
        wantsWarranty === true) {
      return "extended";
    }

    // Standard (30-45 min): Test drive or appraisal only
    return "standard";
  };

  const currentStepData = filteredSteps[currentStep];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {filteredSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {index < currentStep ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < filteredSteps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Step {currentStep + 1} of {filteredSteps.length}: {currentStepData.title}
          </h2>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {currentStepData.question}
        </h3>
        
        {currentStepData.description && (
          <p className="text-gray-600 mb-6">{currentStepData.description}</p>
        )}

        {/* Input Field */}
        {currentStepData.type === 'text' && (
          <input
            type="text"
            value={formData[currentStepData.field]}
            onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
            placeholder={currentStepData.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        )}

        {currentStepData.type === 'textarea' && (
          <textarea
            value={formData[currentStepData.field]}
            onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
            placeholder={currentStepData.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
        )}

        {currentStepData.type === 'yesno' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleInputChange(currentStepData.field, true)}
              className={`p-6 border-2 rounded-lg transition-all ${
                formData[currentStepData.field] === true
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold text-gray-900">Yes</div>
              </div>
            </button>
            
            <button
              onClick={() => handleInputChange(currentStepData.field, false)}
              className={`p-6 border-2 rounded-lg transition-all ${
                formData[currentStepData.field] === false
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                  : 'border-gray-300 hover:border-red-400'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">❌</div>
                <div className="font-semibold text-gray-900">No</div>
              </div>
            </button>
          </div>
        )}

        {currentStepData.type === 'select' && (
          <div className="space-y-3">
            {currentStepData.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange(currentStepData.field, option.value)}
                className={`w-full p-4 text-left border rounded-lg transition-all ${
                  formData[currentStepData.field] === option.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-lg border flex items-center space-x-2 ${
              currentStep === 0
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
              canProceed()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{currentStep === filteredSteps.length - 1 ? 'Schedule Appointment' : 'Next'}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Intent Preview */}
      {Object.values(formData).some(value => value !== null && value !== '') && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Intent Analysis:</h4>
          <div className="space-y-2 text-sm">
            {formData.name && <div><span className="font-medium">Name:</span> {formData.name}</div>}
            {formData.rawInput && <div><span className="font-medium">Visit Reason:</span> {formData.rawInput}</div>}
            
            {/* Branching Questions Summary */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="font-medium text-gray-700 mb-2">Responses:</div>
              {formData.visitReason && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Visit Reason:</span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {formData.visitReason.replace('_', ' ')}
                  </span>
                </div>
              )}
              {formData.needsFinancing !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Financing:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.needsFinancing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.needsFinancing ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {formData.willFinalizePaperwork !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Paperwork:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.willFinalizePaperwork ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.willFinalizePaperwork ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {formData.needsAppraisal !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Appraisal:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.needsAppraisal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.needsAppraisal ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {formData.wantsWarranty !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Warranty:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.wantsWarranty ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.wantsWarranty ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Calculated Intent and Time Allocation */}
            {Object.values(formData).filter(v => v !== null && v !== '').length >= 3 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="font-medium text-gray-700">Analysis:</div>
                <div className="flex space-x-2 mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {calculateIntentType(formData).replace('-', ' ').toUpperCase()}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {calculateTimeAllocation(formData).toUpperCase()} TIME
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOnboarding; 