import React, { useState } from 'react';
import { CheckIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const CustomerOnboarding = ({ onCustomerAdded, onProceedToScheduling }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    rawInput: '',
    needsAppraisal: null,
    needsFinancing: null,
    wantsTestDrive: null,
    wantsMultipleCars: null,
    hasTradeIn: null,
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
      field: "rawInput",
      type: "textarea",
      placeholder: "Tell us about your visit (e.g., 'I'm looking to buy a new SUV today')"
    },
    {
      id: 2,
      title: "Appraisal",
      question: "Do you need an appraisal for your current vehicle?",
      field: "needsAppraisal",
      type: "yesno",
      description: "We can evaluate your current vehicle's trade-in value"
    },
    {
      id: 3,
      title: "Financing",
      question: "Do you need financing for your purchase?",
      field: "needsFinancing",
      type: "yesno",
      description: "We offer competitive financing options"
    },
    {
      id: 4,
      title: "Test Drive",
      question: "Would you like to test drive a vehicle today?",
      field: "wantsTestDrive",
      type: "yesno",
      description: "Experience the vehicle before making a decision"
    },
    {
      id: 5,
      title: "Multiple Vehicles",
      question: "Do you want to test drive multiple vehicles?",
      field: "wantsMultipleCars",
      type: "yesno",
      description: "Compare different models and options"
    },
    {
      id: 6,
      title: "Trade-In",
      question: "Do you have a vehicle to trade in?",
      field: "hasTradeIn",
      type: "yesno",
      description: "We can help you with the trade-in process"
    },
    {
      id: 7,
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
      id: 8,
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate intent type based on answers
      const intentType = calculateIntentType(formData);
      
      // Create customer data
      const customerData = {
        ...formData,
        intentType,
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
    const currentField = steps[currentStep].field;
    return formData[currentField] !== null && formData[currentField] !== '';
  };

  // Calculate intent type based on branching answers
  const calculateIntentType = (data) => {
    const {
      needsAppraisal,
      needsFinancing,
      wantsTestDrive,
      wantsMultipleCars,
      hasTradeIn
    } = data;

    // High-intent purchase indicators
    const highIntentIndicators = [
      needsFinancing === true,
      wantsTestDrive === true,
      wantsMultipleCars === true
    ];

    // Medium-intent indicators
    const mediumIntentIndicators = [
      hasTradeIn === true,
      needsAppraisal === true
    ];

    // Low-intent indicators
    const lowIntentIndicators = [
      needsAppraisal === false,
      needsFinancing === false,
      wantsTestDrive === false,
      wantsMultipleCars === false,
      hasTradeIn === false
    ];

    const highIntentCount = highIntentIndicators.filter(Boolean).length;
    const mediumIntentCount = mediumIntentIndicators.filter(Boolean).length;
    const lowIntentCount = lowIntentIndicators.filter(Boolean).length;

    // Determine intent type based on answers
    if (highIntentCount >= 2) {
      return "purchase";
    } else if (highIntentCount === 1 && mediumIntentCount >= 1) {
      return "purchase";
    } else if (hasTradeIn === true && needsAppraisal === true) {
      return "trade-in";
    } else if (mediumIntentCount >= 2) {
      return "service";
    } else if (lowIntentCount >= 3) {
      return "browsing";
    } else {
      return "other";
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
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
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Step {currentStep + 1} of {steps.length}: {currentStepData.title}
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
            <span>{currentStep === steps.length - 1 ? 'Schedule Appointment' : 'Next'}</span>
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
              {formData.wantsTestDrive !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Test Drive:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.wantsTestDrive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.wantsTestDrive ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {formData.wantsMultipleCars !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Multiple Cars:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.wantsMultipleCars ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.wantsMultipleCars ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {formData.hasTradeIn !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Trade-In:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.hasTradeIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.hasTradeIn ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Calculated Intent */}
            {Object.values(formData).filter(v => v !== null && v !== '').length >= 3 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="font-medium text-gray-700">Calculated Intent:</div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {calculateIntentType(formData).replace('-', ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOnboarding; 