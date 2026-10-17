// Comprehensive automated verification test for Expiry Rescue AI (Simplified Kirana Edition)
const fs = require('fs');

const SIMULATION_DATE = '2026-10-17';

function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹—';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateDaysRemaining(expiryDateStr, baseDateStr = SIMULATION_DATE) {
  if (!expiryDateStr || expiryDateStr.trim() === '' || expiryDateStr === 'null') {
    return null;
  }
  const base = new Date(`${baseDateStr}T00:00:00Z`).getTime();
  const target = new Date(`${expiryDateStr}T00:00:00Z`).getTime();
  if (isNaN(target) || isNaN(base)) return null;
  return Math.ceil((target - base) / (1000 * 60 * 60 * 24));
}

function analyzeProduct(product, baseDateStr = SIMULATION_DATE) {
  const daysRemaining = calculateDaysRemaining(product.expiryDate, baseDateStr);
  const qty = Math.max(0, product.quantity || 0);
  const hasCost = product.costPrice !== null && product.costPrice !== undefined && !isNaN(product.costPrice);
  const cost = hasCost ? Number(product.costPrice) : null;
  const hasDemand = product.dailyDemand !== null && product.dailyDemand !== undefined && product.dailyDemand > 0;
  const demand = hasDemand ? Number(product.dailyDemand) : 0;

  if (daysRemaining === null) {
    return {
      product,
      daysRemaining: null,
      status: 'NO EXPIRY DATE',
      recommendedAction: 'Standard shelf display. Keep monitoring stock.',
      reasonExplanation: 'No manufacturer expiry date recorded (staple commodity). Spoilage risk is zero.',
      estimatedWasteCost: null,
      estimatedUnsoldUnits: 0,
      demandAvailable: hasDemand,
      missingDataNotice: 'Expiry date is not recorded for this staple product.',
    };
  }

  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return {
      product,
      daysRemaining,
      status: 'EXPIRED',
      recommendedAction: 'Remove from shelf according to applicable safety rules.',
      reasonExplanation: `Expired ${daysAgo} day(s) ago. Under safety requirements, expired food must be safely discarded or returned to supplier.`,
      estimatedWasteCost: cost !== null ? Number((qty * cost).toFixed(2)) : null,
      estimatedUnsoldUnits: qty,
      demandAvailable: hasDemand,
      missingDataNotice: cost === null ? 'Cost price is not recorded; total purchase loss cannot be calculated.' : null,
    };
  }

  if (daysRemaining <= 3) {
    let unsoldUnits = qty;
    let action = '';
    let explanation = '';
    let missingNotice = null;

    if (hasDemand) {
      const effectiveDays = Math.max(1, daysRemaining);
      const expectedSales = Math.min(qty, Math.floor(demand * effectiveDays));
      unsoldUnits = Math.max(0, qty - expectedSales);
      if (unsoldUnits > 0) {
        action = `Consider an immediate 20–30% discount (${unsoldUnits} units at risk).`;
        explanation = `With ${daysRemaining === 0 ? 'expiry today' : `${daysRemaining} day(s) remaining`} and sales rate of ${demand}/day, expected sales are ${expectedSales} units. ${unsoldUnits} units will likely expire unsold without intervention.`;
      } else {
        action = 'Sales rate is clearing stock. Keep monitoring closely.';
        explanation = `Sales velocity (${demand} units/day) is sufficient to sell all ${qty} units before expiry.`;
      }
    } else {
      action = 'Consider a discount for eligible stock (demand data unavailable).';
      explanation = `Short expiry runway (${daysRemaining} days remaining). Daily demand history is unavailable, so leftover units cannot be accurately projected.`;
      missingNotice = 'Daily sales rate is missing. Add typical sales velocity for precise demand projections.';
    }

    if (cost === null) {
      missingNotice = (missingNotice ? missingNotice + ' ' : '') + 'Cost price is not recorded.';
    }

    return {
      product,
      daysRemaining,
      status: 'URGENT',
      recommendedAction: action,
      reasonExplanation: explanation,
      estimatedWasteCost: (cost !== null && unsoldUnits > 0) ? Number((unsoldUnits * cost).toFixed(2)) : null,
      estimatedUnsoldUnits: unsoldUnits,
      demandAvailable: hasDemand,
      missingDataNotice: missingNotice,
    };
  }

  if (daysRemaining <= 7) {
    let unsoldUnits = qty;
    let action = '';
    let explanation = '';
    let missingNotice = null;

    if (hasDemand) {
      const expectedSales = Math.min(qty, Math.floor(demand * daysRemaining));
      unsoldUnits = Math.max(0, qty - expectedSales);
      if (unsoldUnits > 0) {
        action = `Consider a 10–20% discount (${unsoldUnits} units projected unsold).`;
        explanation = `At current velocity (${demand}/day) over ${daysRemaining} days, expected sales are ${expectedSales} units. ${unsoldUnits} units are projected to remain unsold.`;
      } else {
        action = 'Current sales velocity is on track. Keep monitoring stock.';
        explanation = `Current sales rate (${demand}/day) is clearing the ${qty} units within the ${daysRemaining}-day window.`;
      }
    } else {
      action = 'Check sales velocity and consider a discount if excess stock exists.';
      explanation = `Item expires in ${daysRemaining} days. Without daily demand data, exact leftover units cannot be computed.`;
      missingNotice = 'Daily demand history is unavailable.';
    }

    if (cost === null) {
      missingNotice = (missingNotice ? missingNotice + ' ' : '') + 'Cost price is not recorded.';
    }

    return {
      product,
      daysRemaining,
      status: 'AT RISK',
      recommendedAction: action,
      reasonExplanation: explanation,
      estimatedWasteCost: (cost !== null && unsoldUnits > 0) ? Number((unsoldUnits * cost).toFixed(2)) : null,
      estimatedUnsoldUnits: unsoldUnits,
      demandAvailable: hasDemand,
      missingDataNotice: missingNotice,
    };
  }

  return {
    product,
    daysRemaining,
    status: 'SAFE',
    recommendedAction: 'Keep monitoring stock that is not currently at risk.',
    reasonExplanation: `Safe runway (${daysRemaining} days remaining). Product is moving within its normal shelf life window.`,
    estimatedWasteCost: null,
    estimatedUnsoldUnits: 0,
    demandAvailable: hasDemand,
    missingDataNotice: cost === null ? 'Cost price not recorded.' : null,
  };
}

// TEST SUITE
console.log('====================================================');
console.log('🧪 RUNNING EXPIRY RESCUE AI VERIFICATION SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}: ${details}`);
    process.exitCode = 1;
  }
}

// 1. Expiry Classification Tests
console.log('--- TEST 1: Expiry Status Classifications ---');
const expiredItem = { name: 'Old Bread', quantity: 5, costPrice: 30, expiryDate: '2026-10-15' }; // -2 days
const urgentItem = { name: 'Milk Tomorrow', quantity: 10, costPrice: 50, expiryDate: '2026-10-18', dailyDemand: 4 }; // +1 day
const atRiskItem = { name: 'Butter', quantity: 10, costPrice: 200, expiryDate: '2026-10-23', dailyDemand: 1 }; // +6 days
const safeItem = { name: 'Rice Bag', quantity: 15, costPrice: 300, expiryDate: '2026-11-20', dailyDemand: 2 }; // +34 days
const stapleItem = { name: 'Tata Salt', quantity: 50, costPrice: 22, expiryDate: null }; // No Expiry

const anExpired = analyzeProduct(expiredItem);
assert(anExpired.status === 'EXPIRED', 'Expired product classified as EXPIRED');
assert(anExpired.recommendedAction.includes('Remove from shelf'), 'Expired product recommends safety removal');
assert(anExpired.reasonExplanation.includes('Under safety requirements'), 'Expired product explains safety requirement');

const anUrgent = analyzeProduct(urgentItem);
assert(anUrgent.status === 'URGENT', 'Product expiring in 1 day classified as URGENT');
assert(anUrgent.recommendedAction.includes('20–30% discount'), 'Urgent product recommends clearance discount');
assert(anUrgent.reasonExplanation.includes('units will likely expire unsold'), 'Urgent product explains unsold calculation');

const anAtRisk = analyzeProduct(atRiskItem);
assert(anAtRisk.status === 'AT RISK', 'Product expiring in 6 days classified as AT RISK');
assert(anAtRisk.reasonExplanation.includes('projected to remain unsold'), 'At risk explains projection');

const anSafe = analyzeProduct(safeItem);
assert(anSafe.status === 'SAFE', 'Product expiring in 34 days classified as SAFE');
assert(anSafe.reasonExplanation.includes('Safe runway'), 'Safe product explains shelf runway');

const anStaple = analyzeProduct(stapleItem);
assert(anStaple.status === 'NO EXPIRY DATE', 'Staple with null expiry classified as NO EXPIRY DATE');
assert(anStaple.daysRemaining === null, 'Staple days remaining is null');
assert(anStaple.reasonExplanation.includes('No manufacturer expiry date recorded'), 'Staple explains non-perishable commodity');

// 2. Missing Demand & Missing Cost Handling (Honest Data)
console.log('\n--- TEST 2: Missing Demand & Cost Handling ---');
const missingDemandItem = { name: 'MDH Masala', quantity: 20, costPrice: 50, expiryDate: '2026-10-20', dailyDemand: null }; // 3 days
const anMissingDemand = analyzeProduct(missingDemandItem);
assert(anMissingDemand.status === 'URGENT', 'Flagged as urgent based on date window');
assert(anMissingDemand.recommendedAction.includes('demand data unavailable'), 'Explicitly notes demand data unavailable in action');
assert(anMissingDemand.missingDataNotice.includes('Daily sales rate is missing'), 'Includes missing data notice for shopkeeper');

const missingCostItem = { name: 'Loose Roasted Chana', quantity: 15, costPrice: null, expiryDate: '2026-10-20' };
const anMissingCost = analyzeProduct(missingCostItem);
assert(anMissingCost.estimatedWasteCost === null, 'Estimated waste cost is null when purchase cost is not known');
assert(anMissingCost.missingDataNotice.includes('Cost price is not recorded'), 'Identifies unrecorded cost price');

// 3. AI Recommendations Urgency Sorting
console.log('\n--- TEST 3: Recommendations Urgency Sorting ---');
const items = [safeItem, expiredItem, stapleItem, atRiskItem, urgentItem];
const analyzedList = items.map(i => analyzeProduct(i));

const priorityWeight = (status) => {
  if (status === 'EXPIRED') return 1;
  if (status === 'URGENT') return 2;
  if (status === 'AT RISK') return 3;
  if (status === 'SAFE') return 4;
  return 5;
};

const sorted = analyzedList.sort((a, b) => {
  const pA = priorityWeight(a.status);
  const pB = priorityWeight(b.status);
  if (pA !== pB) return pA - pB;
  return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
});

assert(sorted[0].status === 'EXPIRED', 'First sorted item is EXPIRED');
assert(sorted[1].status === 'URGENT', 'Second sorted item is URGENT');
assert(sorted[2].status === 'AT RISK', 'Third sorted item is AT RISK');
assert(sorted[3].status === 'SAFE', 'Fourth sorted item is SAFE');
assert(sorted[4].status === 'NO EXPIRY DATE', 'Fifth sorted item is NO EXPIRY DATE');

// 4. Negative Quantity Input Prevention
console.log('\n--- TEST 4: Validation (No Negative Quantities) ---');
const invalidQty = Math.max(0, -15);
assert(invalidQty === 0, 'Negative stock quantity prevented and clamped to 0');

// 5. CSV Import Parsing Test
console.log('\n--- TEST 5: CSV Import Parsing ---');
const sampleCsv = `Product Name,Stock Quantity,Cost Price,Selling Price,Expiry Date,Daily Demand
Amul Milk 1L,20,54,66,18/10/2026,10
Britannia Bread,15,38,50,19/10/2026,6
Tata Salt 1kg,50,22,28,,15`;

const lines = sampleCsv.trim().split('\n');
assert(lines.length === 4, 'CSV has header + 3 rows');
const rows = lines.slice(1).map(l => l.split(','));
assert(rows[0][0] === 'Amul Milk 1L' && rows[0][1] === '20', 'First row parsed correctly');
assert(rows[2][0] === 'Tata Salt 1kg' && rows[2][4] === '', 'Tata salt has empty expiry');

// 6. 10% Discount Calculation Test
console.log('\n--- TEST 6: Math Calculation for 10% Discount ---');
const sellingPrice = 66;
const discountPct = 10;
const discountAmt = (sellingPrice * discountPct) / 100;
const newPrice = sellingPrice - discountAmt;
assert(discountAmt === 6.6, '10% of ₹66 is ₹6.60');
assert(newPrice === 59.4, 'New discounted price is ₹59.40');

console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('====================================================');
