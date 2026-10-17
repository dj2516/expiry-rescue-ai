export type ProductStatus = 'EXPIRED' | 'URGENT' | 'AT RISK' | 'SAFE' | 'NO EXPIRY DATE';
export type DataMode = 'demo' | 'real_shop';

export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
  costPrice?: number | null; // optional purchase cost in ₹
  sellingPrice?: number | null; // optional retail price in ₹
  expiryDate?: string | null; // ISO YYYY-MM-DD or null
  dailyDemand?: number | null; // optional historical daily sales
  category?: string;
  unit?: string;
}

export interface ProductAnalysis {
  product: ProductItem;
  daysRemaining: number | null;
  status: ProductStatus;
  recommendedAction: string;
  reasonExplanation: string;
  estimatedWasteCost: number | null;
  estimatedUnsoldUnits: number;
  demandAvailable: boolean;
  missingDataNotice?: string | null;
}

export interface DashboardMetrics {
  totalBatches: number;
  batchesAtRisk: number; // URGENT + AT RISK
  expiredBatches: number;
  estimatedCostAtRisk: number | null;
  hasReliableCost: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isRuleBased?: boolean;
}

export const SIMULATION_DATE = '2026-10-17';

// Formatting utilities
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹—';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatIndianDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'null') return 'No Expiry Date';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function calculateDaysRemaining(
  expiryDateStr: string | null | undefined,
  baseDateStr: string = SIMULATION_DATE
): number | null {
  if (!expiryDateStr || expiryDateStr.trim() === '' || expiryDateStr === 'null') {
    return null;
  }
  const base = new Date(`${baseDateStr}T00:00:00Z`).getTime();
  const target = new Date(`${expiryDateStr}T00:00:00Z`).getTime();
  if (isNaN(target) || isNaN(base)) return null;
  return Math.ceil((target - base) / (1000 * 60 * 60 * 24));
}

export function analyzeProduct(
  product: ProductItem,
  baseDateStr: string = SIMULATION_DATE
): ProductAnalysis {
  const daysRemaining = calculateDaysRemaining(product.expiryDate, baseDateStr);
  const qty = Math.max(0, product.quantity || 0);
  const hasCost = product.costPrice !== null && product.costPrice !== undefined && !isNaN(product.costPrice);
  const cost = hasCost ? Number(product.costPrice) : null;
  const hasDemand = product.dailyDemand !== null && product.dailyDemand !== undefined && product.dailyDemand > 0;
  const demand = hasDemand ? Number(product.dailyDemand) : 0;

  // 1. NO EXPIRY DATE
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

  // 2. EXPIRED
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

  // 3. URGENT (0 to 3 days)
  if (daysRemaining <= 3) {
    let unsoldUnits = qty;
    let action = '';
    let explanation = '';
    let missingNotice: string | null = null;

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

  // 4. AT RISK (4 to 7 days)
  if (daysRemaining <= 7) {
    let unsoldUnits = qty;
    let action = '';
    let explanation = '';
    let missingNotice: string | null = null;

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

  // 5. SAFE (> 7 days)
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
