import { INITIAL_PRODUCTS } from './src/data/mockData.ts';
import { executeInventoryTool } from './src/services/inventoryTools.ts';
import { runDeterministicToolFallback } from './src/services/agentEngine.ts';

console.log('================================================================');
console.log('🧪 RUNNING EXPIRY RESCUE AI — AGENT & TOOL VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${details}`);
    failCount++;
  }
}

// -------------------------------------------------------------------------
// TEST 1: Ask for the expiry date of a product that exists ("milk")
// -------------------------------------------------------------------------
console.log('--- TEST 1: Expiry date of existing product ("milk") ---');
const q1 = "What is the expiry date of milk?";
const res1 = runDeterministicToolFallback(q1, [], INITIAL_PRODUCTS);

assert(res1.toolsUsed.includes('get_product_details'), 'Tool get_product_details invoked');
assert(res1.text.includes('Amul Taaza') || res1.text.includes('18/10/2026'), 'Returns actual milk record and date');
assert(!res1.text.includes('Total Batches: 20'), 'Does NOT return generic inventory summary');
console.log('Response excerpt:\n', res1.text.substring(0, 300), '\n');

// -------------------------------------------------------------------------
// TEST 2: Ask for its current stock quantity
// -------------------------------------------------------------------------
console.log('--- TEST 2: Current stock quantity ("How much milk stock is left?") ---');
const q2 = "How much milk stock is left?";
const res2 = runDeterministicToolFallback(q2, [], INITIAL_PRODUCTS);

assert(res2.toolsUsed.includes('get_product_details'), 'Tool get_product_details invoked for stock');
assert(res2.text.includes('24 pouches') || res2.text.includes('24'), 'Returns correct stock count (24 units)');
assert(!res2.text.includes('Total Batches: 20'), 'Specific answer returned, not general summary');

// -------------------------------------------------------------------------
// TEST 3: Ask which product expires first
// -------------------------------------------------------------------------
console.log('--- TEST 3: Which product expires first ---');
const q3 = "Which product expires first?";
const res3 = runDeterministicToolFallback(q3, [], INITIAL_PRODUCTS);

assert(res3.toolsUsed.includes('calculate_inventory_metrics'), 'Tool calculate_inventory_metrics invoked');
assert(res3.text.includes('Modern Sandwich Bread') || res3.text.includes('Earliest Expiring'), 'Identifies earliest expiring batch');

// -------------------------------------------------------------------------
// TEST 4: Ask for an aggregate involving multiple products (expiring next 7 days)
// -------------------------------------------------------------------------
console.log('--- TEST 4: Aggregate query ("How many products expire in the next seven days?") ---');
const q4 = "How many products expire in the next seven days?";
const res4 = runDeterministicToolFallback(q4, [], INITIAL_PRODUCTS);

assert(res4.toolsUsed.includes('query_inventory'), 'Tool query_inventory invoked for 7-day window');
assert(res4.text.includes('Next 7 Days') && res4.text.includes('batches'), 'Computes aggregate count and lists items');

// -------------------------------------------------------------------------
// TEST 5: Ask a discount or inventory-value calculation
// -------------------------------------------------------------------------
console.log('--- TEST 5: Discount calculation ("What would happen if I reduced milk price by 15%?") ---');
const q5 = "What would happen if I reduced milk price by 15%?";
const res5 = runDeterministicToolFallback(q5, [], INITIAL_PRODUCTS);

assert(res5.toolsUsed.includes('calculate_scenario'), 'Tool calculate_scenario invoked');
assert(res5.text.includes('15%') && (res5.text.includes('56.10') || res5.text.includes('₹56.10')), 'Correctly calculates 15% off ₹66 = ₹56.10');
assert(res5.text.includes('hypothetical simulation') || res5.text.includes('Hypothetical'), 'Labels calculation as hypothetical simulation');

// -------------------------------------------------------------------------
// TEST 6: Ask about a product that does not exist
// -------------------------------------------------------------------------
console.log('--- TEST 6: Non-existent product ("What is the expiry date of chocolate?") ---');
const q6 = "What is the expiry date of chocolate?";
const res6 = runDeterministicToolFallback(q6, [], INITIAL_PRODUCTS);

assert(res6.text.includes('Product Not Found') || res6.text.includes('No product matching'), 'Acknowledges product is not in inventory');
assert(!res6.text.includes('18/10/2026'), 'Does not fabricate an expiry date');

// -------------------------------------------------------------------------
// TEST 7: Ask about a product with a missing expiry date (Tata Salt)
// -------------------------------------------------------------------------
console.log('--- TEST 7: Product with missing expiry date (Tata Salt) ---');
const q7 = "What is the expiry date of Tata Salt?";
const res7 = runDeterministicToolFallback(q7, [], INITIAL_PRODUCTS);

assert(res7.text.includes('Tata Salt'), 'Identifies Tata Salt');
assert(res7.text.includes('No manufacturer expiry date recorded') || res7.text.includes('staple commodity'), 'Explains staple non-perishable status');

// -------------------------------------------------------------------------
// TEST 8: Follow-up question referring to previously discussed product
// -------------------------------------------------------------------------
console.log('--- TEST 8: Follow-up question ("How much stock is left?") ---');
const historyForFollowUp = [
  { role: 'user', content: 'What is the expiry date of Amul Milk?' },
  { role: 'assistant', content: 'Amul Taaza Milk 1L expires on 18/10/2026 with 1 day remaining.' },
];
const q8 = "How much stock is left?";
const res8 = runDeterministicToolFallback(q8, historyForFollowUp, INITIAL_PRODUCTS);

assert(res8.text.includes('Amul Taaza') || res8.text.includes('24'), 'Resolves "stock" to Amul Milk from conversation history');

// -------------------------------------------------------------------------
// TEST 9: Change a product\'s expiry date or quantity and repeat the question
// -------------------------------------------------------------------------
console.log('--- TEST 9: Dynamic inventory update reflects in answer ---');
const updatedProducts = INITIAL_PRODUCTS.map((p) => {
  if (p.id === 'prod-01') {
    return { ...p, quantity: 99, expiryDate: '2026-11-20' }; // updated stock to 99 and expiry to 20/11/2026
  }
  return p;
});

const res9 = runDeterministicToolFallback("What is the expiry date of milk?", [], updatedProducts);
assert(res9.text.includes('20/11/2026'), 'Reflects updated expiry date (20/11/2026)');
assert(res9.text.includes('99'), 'Reflects updated stock quantity (99)');

// -------------------------------------------------------------------------
// TEST 10: Ask a question that requires unavailable sales history
// -------------------------------------------------------------------------
console.log('--- TEST 10: Unavailable sales history (MDH Deggi Mirch) ---');
const toolResult10 = executeInventoryTool('get_sales_history', { identifier: 'MDH Deggi Mirch' }, INITIAL_PRODUCTS);

assert(toolResult10.data.salesHistoryAvailable === false, 'Tool flags sales history as unavailable');
assert(toolResult10.data.message.includes('No sales velocity') || toolResult10.data.message.includes('unavailable'), 'Explains sales velocity limitation');

// -------------------------------------------------------------------------
// TEST 11: Financial Aggregation & Missing Cost Handling
// -------------------------------------------------------------------------
console.log('--- TEST 11: Inventory cost metric ---');
const q11 = "How much inventory cost is associated with products expiring this week?";
const res11 = runDeterministicToolFallback(q11, [], INITIAL_PRODUCTS);

assert(res11.toolsUsed.includes('calculate_inventory_metrics'), 'Invokes calculate_inventory_metrics');
assert(res11.text.includes('Purchase Cost at Risk') && res11.text.includes('₹'), 'Computes at-risk cost in INR');

console.log('\n================================================================');
console.log(`FINAL RESULT: ${passCount} / ${passCount + failCount} TESTS PASSED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
