import {
  ProductItem,
  ChatMessage,
  analyzeProduct,
  formatINR,
  formatIndianDate,
  SIMULATION_DATE,
} from '../types';

/**
 * Handles shopkeeper AI queries using live inventory data.
 * Checks for server-side LLM endpoint; if unavailable, returns transparent rule-based guidance.
 */
export async function queryAiAssistant(
  question: string,
  products: ProductItem[]
): Promise<ChatMessage> {
  const cleanQ = question.trim().toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Analyze all active products using deterministic business logic
  const analyses = products.map((p) => analyzeProduct(p, SIMULATION_DATE));
  const expired = analyses.filter((a) => a.status === 'EXPIRED');
  const urgent = analyses.filter((a) => a.status === 'URGENT');
  const atRisk = analyses.filter((a) => a.status === 'AT RISK');
  const safe = analyses.filter((a) => a.status === 'SAFE');
  const noExpiry = analyses.filter((a) => a.status === 'NO EXPIRY DATE');
  const needingAttention = [...expired, ...urgent, ...atRisk];

  // 2. Check if a live LLM endpoint is configured in environment (server-side proxy)
  const llmEndpoint = import.meta.env.VITE_AI_API_URL;

  if (llmEndpoint) {
    try {
      const inventoryContext = analyses.map((a) => ({
        name: a.product.name,
        quantity: a.product.quantity,
        costPrice: a.product.costPrice,
        sellingPrice: a.product.sellingPrice,
        expiryDate: a.product.expiryDate,
        daysRemaining: a.daysRemaining,
        status: a.status,
        recommendedAction: a.recommendedAction,
      }));

      const res = await fetch(llmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          inventoryContext,
          simulationDate: SIMULATION_DATE,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          return {
            id: `msg-${Date.now()}`,
            sender: 'assistant',
            text: data.reply,
            timestamp,
            isRuleBased: false,
          };
        }
      }
    } catch (err) {
      console.warn('Live LLM endpoint failed, falling back to rule-based explanation:', err);
    }
  }

  // 3. Fallback: Rule-Based Explanations grounded in actual inventory
  const disclaimer = `> **Notice**: Live AI API is not configured. Providing verified, rule-based guidance calculated directly from your active inventory.\n\n`;

  // Question 1: Which products need attention today?
  if (
    cleanQ.includes('which product') ||
    cleanQ.includes('attention today') ||
    cleanQ.includes('need attention') ||
    cleanQ.includes('what needs attention') ||
    cleanQ.includes('at risk today')
  ) {
    if (needingAttention.length === 0) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `${disclaimer}**All products are currently safe!**\n\nThere are 0 expired or at-risk batches in your inventory right now. Continue monitoring as usual.`,
        timestamp,
        isRuleBased: true,
      };
    }

    let report = `${disclaimer}### Products Needing Attention Today (${needingAttention.length} Batches)\n\n`;

    if (expired.length > 0) {
      report += `**🔴 Already Expired (${expired.length} batches):**\n`;
      expired.forEach((a) => {
        report += `- **${a.product.name}**: ${a.product.quantity} units (Expired on ${formatIndianDate(a.product.expiryDate)}).\n  *Action:* ${a.recommendedAction}\n`;
      });
      report += '\n';
    }

    if (urgent.length > 0) {
      report += `**🟠 Urgent (Expires within 3 days — ${urgent.length} batches):**\n`;
      urgent.forEach((a) => {
        const costInfo = a.estimatedWasteCost ? ` | Est. Risk: ${formatINR(a.estimatedWasteCost)}` : '';
        report += `- **${a.product.name}**: ${a.product.quantity} units (${a.daysRemaining} days left, Exp: ${formatIndianDate(a.product.expiryDate)}${costInfo}).\n  *Action:* ${a.recommendedAction}\n`;
      });
      report += '\n';
    }

    if (atRisk.length > 0) {
      report += `**🟡 At Risk (Expires in 4–7 days — ${atRisk.length} batches):**\n`;
      atRisk.forEach((a) => {
        report += `- **${a.product.name}**: ${a.product.quantity} units (${a.daysRemaining} days left, Exp: ${formatIndianDate(a.product.expiryDate)}).\n  *Action:* ${a.recommendedAction}\n`;
      });
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: report,
      timestamp,
      isRuleBased: true,
    };
  }

  // Question 2: Why is this product at risk?
  if (cleanQ.includes('why') && (cleanQ.includes('risk') || cleanQ.includes('urgent') || cleanQ.includes('expired'))) {
    // Find if a specific product was mentioned in question
    const matchedAnalysis = analyses.find((a) =>
      cleanQ.includes(a.product.name.toLowerCase().split(' ')[0]) ||
      cleanQ.includes(a.product.name.toLowerCase())
    );

    if (matchedAnalysis) {
      const { product, status, daysRemaining, demandAvailable } = matchedAnalysis;
      let explanation = `${disclaimer}### Risk Analysis for ${product.name}\n\n`;
      explanation += `- **Current Status:** ${status}\n`;
      explanation += `- **Available Stock:** ${product.quantity} units\n`;
      explanation += `- **Expiry Date:** ${formatIndianDate(product.expiryDate)} (${daysRemaining !== null ? `${daysRemaining} days remaining` : 'No expiry'})\n`;

      if (status === 'EXPIRED') {
        explanation += `- **Reason:** The expiry date has already passed. The product is no longer fit for sale under safety regulations.\n`;
        explanation += `- **Action:** ${matchedAnalysis.recommendedAction}`;
      } else if (status === 'URGENT' || status === 'AT RISK') {
        if (demandAvailable && product.dailyDemand) {
          const expectedSales = Math.min(product.quantity, Math.floor(product.dailyDemand * (daysRemaining || 1)));
          explanation += `- **Reason:** With ${daysRemaining} days remaining and an average sales rate of ${product.dailyDemand} units/day, you are projected to sell ${expectedSales} units. That leaves ${matchedAnalysis.estimatedUnsoldUnits} units at risk of spoiling.\n`;
        } else {
          explanation += `- **Reason:** This item expires in ${daysRemaining} days. Historical daily demand data is unavailable, so we flag the batch based on the short expiry window.\n`;
        }
        explanation += `- **Action:** ${matchedAnalysis.recommendedAction}`;
      } else if (status === 'SAFE') {
        explanation += `- **Reason:** With ${daysRemaining} days remaining, this batch has ample shelf runway. It is not currently at risk.`;
      } else {
        explanation += `- **Reason:** This is a non-perishable staple with no manufacturer expiry date recorded.`;
      }

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: explanation,
        timestamp,
        isRuleBased: true,
      };
    }

    // Generic answer for why products get flagged
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `${disclaimer}**Why Products Are Marked At Risk:**\n\n1. **URGENT (0–3 Days):** The batch expires today or within 3 days. There may not be enough shelf runway to sell regular stock at full retail price.\n2. **AT RISK (4–7 Days):** Expiry is within a week. If customer footfall is slow, some units could remain unsold.\n3. **EXPIRED (< 0 Days):** The expiry date has already passed.\n\n*Specify any product name (e.g., "Why is Amul Milk at risk?") to see its exact numbers.*`,
      timestamp,
      isRuleBased: true,
    };
  }

  // Question 3: What should I do with this batch / product?
  if (
    cleanQ.includes('what should i do') ||
    cleanQ.includes('recommendation') ||
    cleanQ.includes('what to do with') ||
    cleanQ.includes('how to handle')
  ) {
    const matchedAnalysis = analyses.find((a) =>
      cleanQ.includes(a.product.name.toLowerCase().split(' ')[0]) ||
      cleanQ.includes(a.product.name.toLowerCase())
    );

    if (matchedAnalysis) {
      const { product, status, recommendedAction } = matchedAnalysis;
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `${disclaimer}### Recommended Action for ${product.name}\n\n- **Status:** ${status}\n- **Current Stock:** ${product.quantity} units\n- **Action:** ${recommendedAction}\n\n*Note: Never attempt to sell stock that has already expired.*`,
        timestamp,
        isRuleBased: true,
      };
    }

    // Generic guidance on actions
    let actionGuide = `${disclaimer}### Standard Kirana Action Rules:\n\n`;
    actionGuide += `1. **Expired Stock:** Immediately remove from display and dispose according to safety rules. Do not sell expired food.\n`;
    actionGuide += `2. **Urgent Stock (≤ 3 Days):** Place on the front shelf and consider an immediate 20–30% clearance discount.\n`;
    actionGuide += `3. **At-Risk Stock (4–7 Days):** Offer a 10–20% discount or bundle with fast-moving items.\n`;
    actionGuide += `4. **Safe Stock (> 7 Days):** Keep monitoring at normal retail price.\n\nType the name of any product to see its specific recommendation.`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: actionGuide,
      timestamp,
      isRuleBased: true,
    };
  }

  // Question 4: What discount would 10% (or X%) off give me?
  const discountMatch = cleanQ.match(/(\d+)%\s*(off|discount)?/);
  if (discountMatch || cleanQ.includes('discount')) {
    const pct = discountMatch ? parseInt(discountMatch[1], 10) : 10;
    
    // Find if a specific product was mentioned
    const matchedProduct = products.find((p) =>
      cleanQ.includes(p.name.toLowerCase().split(' ')[0]) ||
      cleanQ.includes(p.name.toLowerCase())
    ) || products.find((p) => p.sellingPrice !== null && p.sellingPrice !== undefined);

    if (matchedProduct && matchedProduct.sellingPrice) {
      const originalPrice = matchedProduct.sellingPrice;
      const discountAmount = Number(((originalPrice * pct) / 100).toFixed(2));
      const discountedPrice = Math.max(0, originalPrice - discountAmount);
      const cost = matchedProduct.costPrice;
      const marginAfterDiscount = cost !== null && cost !== undefined ? discountedPrice - cost : null;

      let explanation = `${disclaimer}### ${pct}% Discount Calculation for ${matchedProduct.name}\n\n`;
      explanation += `- **Current Selling Price:** ${formatINR(originalPrice)}\n`;
      explanation += `- **Discount (${pct}%):** -${formatINR(discountAmount)}\n`;
      explanation += `- **New Selling Price:** **${formatINR(discountedPrice)}**\n`;
      if (cost !== null && cost !== undefined) {
        explanation += `- **Purchase Cost:** ${formatINR(cost)}\n`;
        explanation += `- **Margin Per Unit:** ${marginAfterDiscount !== null && marginAfterDiscount >= 0 ? '+' : ''}${formatINR(marginAfterDiscount)} (${marginAfterDiscount !== null && marginAfterDiscount >= 0 ? 'Profitable' : 'Below Cost'})\n`;
      }
      explanation += `\n*If you sell all ${matchedProduct.quantity} units at this discounted rate, total revenue would be **${formatINR(discountedPrice * matchedProduct.quantity)}** instead of letting stock expire.*`;

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: explanation,
        timestamp,
        isRuleBased: true,
      };
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `${disclaimer}**Example ${pct}% Discount:**\n\nA ${pct}% discount lowers your selling price by ${pct} paise per rupee. For an item sold at ₹100, the new price would be ₹${100 - pct}.\n\n*Mention a specific product name (e.g., "What discount would 10% off Amul Milk give me?") to see the exact figures from your inventory.*`,
      timestamp,
      isRuleBased: true,
    };
  }

  // General inventory summary query
  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: `${disclaimer}### Kirana Inventory Summary\n\n- **Total Batches:** ${products.length}\n- **Expired Batches:** ${expired.length}\n- **Batches At Risk:** ${urgent.length + atRisk.length}\n- **Safe / Non-perishable:** ${safe.length + noExpiry.length}\n\n**Common Questions You Can Ask:**\n1. "Which products need attention today?"\n2. "Why is this product at risk?"\n3. "What should I do with this batch?"\n4. "What discount would 10% off give me?"`,
    timestamp,
    isRuleBased: true,
  };
}
