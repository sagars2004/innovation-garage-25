// Scoring weights for different urgency levels and timeframes
const URGENCY_WEIGHTS = {
  "high": 1.0,
  "medium": 0.6,
  "low": 0.3
};

const TIMEFRAME_WEIGHTS = {
  "today": 1.0,
  "this week": 0.7,
  "this month": 0.4,
  "no rush": 0.2
};

// Branching question weights for intent calculation
const BRANCHING_WEIGHTS = {
  // High-intent indicators (strong purchase signals)
  needsFinancing: 0.25,
  wantsTestDrive: 0.20,
  wantsMultipleCars: 0.20,
  
  // Medium-intent indicators (moderate purchase signals)
  hasTradeIn: 0.15,
  needsAppraisal: 0.10,
  
  // Low-intent indicators (weak or negative signals)
  noFinancing: -0.10,
  noTestDrive: -0.15,
  noMultipleCars: -0.10,
  noTradeIn: -0.05,
  noAppraisal: -0.05
};

/**
 * Calculate intent score based on branching questions
 * @param {Object} branchingData - Object containing yes/no answers to branching questions
 * @returns {number} Intent score (0-1)
 */
export function calculateIntentScore(branchingData) {
  const {
    needsAppraisal,
    needsFinancing,
    wantsTestDrive,
    wantsMultipleCars,
    hasTradeIn
  } = branchingData;

  let intentScore = 0.5; // Base score

  // Add positive weights for "Yes" answers
  if (needsFinancing === true) intentScore += BRANCHING_WEIGHTS.needsFinancing;
  if (wantsTestDrive === true) intentScore += BRANCHING_WEIGHTS.wantsTestDrive;
  if (wantsMultipleCars === true) intentScore += BRANCHING_WEIGHTS.wantsMultipleCars;
  if (hasTradeIn === true) intentScore += BRANCHING_WEIGHTS.hasTradeIn;
  if (needsAppraisal === true) intentScore += BRANCHING_WEIGHTS.needsAppraisal;

  // Subtract weights for "No" answers
  if (needsFinancing === false) intentScore += BRANCHING_WEIGHTS.noFinancing;
  if (wantsTestDrive === false) intentScore += BRANCHING_WEIGHTS.noTestDrive;
  if (wantsMultipleCars === false) intentScore += BRANCHING_WEIGHTS.noMultipleCars;
  if (hasTradeIn === false) intentScore += BRANCHING_WEIGHTS.noTradeIn;
  if (needsAppraisal === false) intentScore += BRANCHING_WEIGHTS.noAppraisal;

  // Normalize to 0-1 range
  return Math.min(Math.max(intentScore, 0), 1);
}

/**
 * Calculate intent type based on branching answers
 * @param {Object} branchingData - Object containing yes/no answers
 * @returns {string} Intent type
 */
export function calculateIntentType(branchingData) {
  const {
    needsAppraisal,
    needsFinancing,
    wantsTestDrive,
    wantsMultipleCars,
    hasTradeIn
  } = branchingData;

  // Count high-intent indicators
  const highIntentCount = [
    needsFinancing === true,
    wantsTestDrive === true,
    wantsMultipleCars === true
  ].filter(Boolean).length;

  // Count medium-intent indicators
  const mediumIntentCount = [
    hasTradeIn === true,
    needsAppraisal === true
  ].filter(Boolean).length;

  // Count low-intent indicators
  const lowIntentCount = [
    needsAppraisal === false,
    needsFinancing === false,
    wantsTestDrive === false,
    wantsMultipleCars === false,
    hasTradeIn === false
  ].filter(Boolean).length;

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
}

/**
 * Calculate comprehensive priority score based on intent, urgency, and timeframe
 * @param {Object} customerData - Complete customer data including branching answers
 * @returns {number} Priority score (0-1)
 */
export function calculateScore(customerData) {
  const intentScore = calculateIntentScore(customerData);
  const urgencyWeight = URGENCY_WEIGHTS[customerData.urgencyLevel] || 0.3;
  const timeframeWeight = TIMEFRAME_WEIGHTS[customerData.preferredTimeframe] || 0.5;
  
  // Combine intent score with traditional weights
  const baseScore = intentScore * urgencyWeight;
  const adjustedScore = baseScore * timeframeWeight;
  
  // Normalize to 0-1 range
  return Math.min(Math.max(adjustedScore, 0), 1);
}

/**
 * Get priority level based on score
 * @param {number} score - Priority score
 * @returns {string} Priority level
 */
export function getPriorityLevel(score) {
  if (score >= 0.8) return "Critical";
  if (score >= 0.6) return "High";
  if (score >= 0.4) return "Medium";
  if (score >= 0.2) return "Low";
  return "Very Low";
}

/**
 * Get color class for priority level
 * @param {string} priorityLevel - Priority level
 * @returns {string} Tailwind color class
 */
export function getPriorityColor(priorityLevel) {
  switch (priorityLevel) {
    case "Critical":
      return "text-red-600 bg-red-50";
    case "High":
      return "text-orange-600 bg-orange-50";
    case "Medium":
      return "text-yellow-600 bg-yellow-50";
    case "Low":
      return "text-blue-600 bg-blue-50";
    case "Very Low":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Calculate time-based decay factor
 * @param {Date} createdAt - When customer was added
 * @returns {number} Decay factor (0-1)
 */
export function calculateTimeDecay(createdAt) {
  const now = new Date();
  const timeDiff = now - createdAt;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Decay factor: 1.0 for first hour, 0.8 after 2 hours, 0.6 after 4 hours
  if (hoursDiff <= 1) return 1.0;
  if (hoursDiff <= 2) return 0.8;
  if (hoursDiff <= 4) return 0.6;
  return 0.4;
}

/**
 * Get final adjusted score with time decay
 * @param {number} baseScore - Original priority score
 * @param {Date} createdAt - When customer was added
 * @returns {number} Adjusted score
 */
export function getAdjustedScore(baseScore, createdAt) {
  const decayFactor = calculateTimeDecay(createdAt);
  return baseScore * decayFactor;
}

/**
 * Get intent breakdown for detailed analysis
 * @param {Object} customerData - Customer data with branching answers
 * @returns {Object} Detailed intent analysis
 */
export function getIntentBreakdown(customerData) {
  const intentScore = calculateIntentScore(customerData);
  const intentType = calculateIntentType(customerData);
  
  return {
    intentScore,
    intentType,
    confidence: intentScore > 0.7 ? "High" : intentScore > 0.4 ? "Medium" : "Low",
    indicators: {
      highIntent: [
        customerData.needsFinancing && "Needs Financing",
        customerData.wantsTestDrive && "Wants Test Drive",
        customerData.wantsMultipleCars && "Wants Multiple Cars"
      ].filter(Boolean),
      mediumIntent: [
        customerData.hasTradeIn && "Has Trade-In",
        customerData.needsAppraisal && "Needs Appraisal"
      ].filter(Boolean),
      lowIntent: [
        !customerData.needsFinancing && "No Financing Needed",
        !customerData.wantsTestDrive && "No Test Drive",
        !customerData.wantsMultipleCars && "Single Vehicle Interest",
        !customerData.hasTradeIn && "No Trade-In",
        !customerData.needsAppraisal && "No Appraisal Needed"
      ].filter(Boolean)
    }
  };
} 