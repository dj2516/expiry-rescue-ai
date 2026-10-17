import {
  type ProductItem,
  SIMULATION_DATE,
  calculateDaysRemaining,
} from '../types/index.ts';
import {
  INVENTORY_TOOLS_DEFINITIONS,
  executeInventoryTool,
} from './inventoryTools.ts';

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  text: string;
  isRuleBased: boolean;
  provider: 'gemini' | 'openai' | 'deterministic-fallback';
  model: string;
  toolsUsed: string[];
}

export interface AgentRequest {
  question: string;
  history?: AgentChatMessage[];
  inventory: ProductItem[];
  simulationDate?: string;
  apiKeyOverride?: string;
}

const SYSTEM_INSTRUCTION = `You are Expiry Rescue AI's retail operations assistant, built specifically for Indian Kirana store owners.
Your mission is to answer inventory, expiry, and pricing questions with 100% accuracy using actual store data.

CRITICAL RULES:
1. ALWAYS inspect real inventory using available tools before answering. NEVER guess or hallucinate product details, expiry dates, stock quantities, or costs.
2. If a product is not found in inventory, state clearly that it was not found and mention similar active products if available.
3. If an expiry date is not recorded (like staple commodities such as Tata Salt or Basmati Rice), explain that it is a non-perishable staple with no recorded expiry.
4. If sales history / daily demand is not recorded, state clearly that sales history is unavailable, so projected unsold units cannot be computed.
5. All calculations (days remaining, discount prices, inventory cost at risk) MUST come from tool results or deterministic arithmetic.
6. Indian Retail Conventions:
   - Currency: Indian Rupee (₹).
   - Date Format: DD/MM/YYYY.
   - Base Simulation Date: 17/10/2026.
7. Food Safety Compliance: NEVER recommend selling food that is already expired. Expired food must be discarded or returned to supplier.
8. Follow-up Context: Use previous messages in the conversation to resolve pronouns and references like "it", "that product", "the other one".
9. Tone: Professional, crisp, respectful ("Namaste"), and practical for a busy retail shopkeeper.`;

/**
 * Execute tool calling loop using Google Gemini REST API.
 */
async function callGeminiAgent(
  apiKey: string,
  modelName: string,
  question: string,
  history: AgentChatMessage[],
  inventory: ProductItem[],
  simulationDate: string
): Promise<AgentResponse> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Format tools for Gemini FunctionDeclarations
  const geminiTools = [
    {
      functionDeclarations: INVENTORY_TOOLS_DEFINITIONS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'OBJECT',
          properties: Object.fromEntries(
            Object.entries(tool.parameters.properties).map(([key, prop]: [string, any]) => [
              key,
              {
                type: prop.type === 'number' ? 'NUMBER' : prop.type === 'string' ? 'STRING' : 'OBJECT',
                description: prop.description,
                ...(prop.enum ? { enum: prop.enum } : {}),
              },
            ])
          ),
          required: (tool.parameters as any).required || [],
        },
      })),
    },
  ];

  // Build message contents including past conversation
  const contents: any[] = [];

  // Add conversation history (up to last 6 messages)
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Add current question
  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  const toolsUsed: string[] = [];
  const MAX_ITERATIONS = 5;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const payload = {
      systemInstruction: {
        parts: [{ text: `${SYSTEM_INSTRUCTION}\nCurrent System Date: ${simulationDate}` }],
      },
      contents,
      tools: geminiTools,
      generationConfig: {
        temperature: 0.2,
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errBody}`);
    }

    const data = (await res.json()) as any;
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parts = candidate.content.parts || [];
    const functionCallPart = parts.find((p: any) => p.functionCall);

    if (functionCallPart && functionCallPart.functionCall) {
      const { name, args } = functionCallPart.functionCall;
      toolsUsed.push(name);

      // Execute tool on live inventory
      const toolResult = executeInventoryTool(name, args || {}, inventory, simulationDate);

      // Append assistant's function call message to contents
      contents.push({
        role: 'model',
        parts: [{ functionCall: { name, args } }],
      });

      // Append function response message
      contents.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name,
              response: toolResult.data,
            },
          },
        ],
      });

      // Loop continues to let Gemini formulate text or call another tool
      continue;
    }

    // Finished generating text response
    const textPart = parts.find((p: any) => p.text);
    return {
      text: textPart ? textPart.text : 'I processed your inventory query.',
      isRuleBased: false,
      provider: 'gemini',
      model: modelName,
      toolsUsed,
    };
  }

  return {
    text: 'I completed the necessary inventory checks for your query.',
    isRuleBased: false,
    provider: 'gemini',
    model: modelName,
    toolsUsed,
  };
}

/**
 * Execute tool calling loop using OpenAI API.
 */
async function callOpenAIAgent(
  apiKey: string,
  modelName: string,
  question: string,
  history: AgentChatMessage[],
  inventory: ProductItem[],
  simulationDate: string
): Promise<AgentResponse> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const openAiTools = INVENTORY_TOOLS_DEFINITIONS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  const messages: any[] = [
    {
      role: 'system',
      content: `${SYSTEM_INSTRUCTION}\nCurrent System Date: ${simulationDate}`,
    },
  ];

  for (const msg of history.slice(-6)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: question });

  const toolsUsed: string[] = [];
  const MAX_ITERATIONS = 5;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        tools: openAiTools,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error('OpenAI returned an empty response.');
    }

    const msg = choice.message;
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        toolsUsed.push(tc.function.name);
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments || '{}');
        } catch {
          parsedArgs = {};
        }

        const toolResult = executeInventoryTool(tc.function.name, parsedArgs, inventory, simulationDate);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult.data),
        });
      }
      continue;
    }

    return {
      text: msg.content || 'Processed your inventory request.',
      isRuleBased: false,
      provider: 'openai',
      model: modelName,
      toolsUsed,
    };
  }

  return {
    text: 'Finished inventory processing.',
    isRuleBased: false,
    provider: 'openai',
    model: modelName,
    toolsUsed,
  };
}

/**
 * Deterministic Tool Engine Fallback.
 * Used when no live API key is set in .env or when offline.
 * Executes the EXACT SAME tools deterministically to answer specific queries accurately.
 * Never outputs a generic static summary for a specific question!
 */
export function runDeterministicToolFallback(
  question: string,
  history: AgentChatMessage[],
  inventory: ProductItem[],
  simulationDate: string = SIMULATION_DATE
): AgentResponse {
  const cleanQ = question.trim().toLowerCase();
  const notice = `> ⚠️ **Notice: Live AI API key is not configured in \`.env\`**\n> Providing a direct deterministic inventory lookup from your live store records. For natural-language reasoning, add \`GEMINI_API_KEY\` to your \`.env\` file.\n\n`;

  // 1. Context Resolution for follow-up questions
  // Check if current question refers to previous product ("it", "that", "the product", "discount it")
  let resolvedIdentifier = '';
  const isFollowUp =
    cleanQ.includes('it') ||
    cleanQ.includes('that product') ||
    cleanQ.includes('how much stock is left') ||
    cleanQ.includes('discount it') ||
    cleanQ.includes('this product');

  if (isFollowUp && history.length > 0) {
    // Search history backwards for a product match
    for (let i = history.length - 1; i >= 0; i--) {
      const prevText = history[i].content.toLowerCase();
      const match = inventory.find(
        (p) => prevText.includes(p.name.toLowerCase()) || prevText.includes(p.name.toLowerCase().split(' ')[0])
      );
      if (match) {
        resolvedIdentifier = match.name;
        break;
      }
    }
  }

  // Find explicit product mentions in current question
  if (!resolvedIdentifier) {
    const explicitMatch = inventory.find(
      (p) => cleanQ.includes(p.name.toLowerCase()) || cleanQ.includes(p.id.toLowerCase())
    );
    if (explicitMatch) {
      resolvedIdentifier = explicitMatch.name;
    } else {
      // Partial word match (e.g. "milk", "bread", "paneer", "salt", "rice", "curd")
      const commonTerms = ['milk', 'bread', 'paneer', 'salt', 'rice', 'curd', 'dahi', 'butter', 'atta', 'noodles', 'biscuit', 'oil', 'chana'];
      for (const term of commonTerms) {
        if (cleanQ.includes(term)) {
          const termMatch = inventory.find((p) => p.name.toLowerCase().includes(term));
          if (termMatch) {
            resolvedIdentifier = termMatch.name;
            break;
          }
        }
      }
    }
  }

  // 2. Intent: Discount / Scenario Calculation
  const discountMatch = cleanQ.match(/(\d+)%\s*(off|discount|reduction)?/);
  if (discountMatch || cleanQ.includes('discount') || cleanQ.includes('price by')) {
    const pct = discountMatch ? parseInt(discountMatch[1], 10) : 10;
    const targetProduct = resolvedIdentifier || (inventory.length > 0 ? inventory[0].name : '');

    const scenarioResult = executeInventoryTool(
      'calculate_scenario',
      { identifier: targetProduct, discountPercent: pct },
      inventory,
      simulationDate
    );

    if (scenarioResult.success && scenarioResult.data) {
      const d: any = scenarioResult.data;
      if (d.calculable === false) {
        return {
          text: `${notice}**${d.productName}**:\n${d.message}`,
          isRuleBased: true,
          provider: 'deterministic-fallback',
          model: 'rule-engine-v2',
          toolsUsed: ['calculate_scenario'],
        };
      }

      let resp = `${notice}### Hypothetical ${pct}% Markdown for ${d.productName}\n\n`;
      resp += `- **Original Selling Price:** ${d.originalPriceINR}\n`;
      resp += `- **${d.discountPercentage} Discount:** -${d.discountAmountINR}\n`;
      resp += `- **New Selling Price:** **${d.newDiscountedPriceINR}**\n`;
      resp += `- **Purchase Cost:** ${d.unitPurchaseCostINR}\n`;
      resp += `- **Margin Per Unit:** ${d.marginPerUnitINR} (${d.isProfitablePerUnit ? 'Profitable' : 'Below Cost'})\n`;
      resp += `- **Current Stock:** ${d.currentStock} ${d.unit}\n`;
      resp += `- **Projected Potential Revenue:** **${d.projectedStockRevenueINR}** (if all units clear)\n\n`;
      resp += `*Note: This is a hypothetical simulation. It does not alter your saved store inventory.*`;

      return {
        text: resp,
        isRuleBased: true,
        provider: 'deterministic-fallback',
        model: 'rule-engine-v2',
        toolsUsed: ['calculate_scenario'],
      };
    }
  }

  // 3. Intent: Specific Product Details (Expiry date, stock, price, etc.)
  const isProductDetailQuery =
    (resolvedIdentifier && !cleanQ.includes('inventory cost') && !cleanQ.includes('total cost') && !cleanQ.includes('at risk cost')) ||
    cleanQ.includes('expiry date of') ||
    cleanQ.includes('how much stock') ||
    cleanQ.includes('stock is left') ||
    cleanQ.includes('details of') ||
    (cleanQ.includes('how much') && !cleanQ.includes('cost') && !cleanQ.includes('value'));

  if (isProductDetailQuery) {
    const target = resolvedIdentifier || cleanQ.replace(/.*(?:of|for|about)\s+/, '').replace(/\?.*/, '').trim();
    const detailsResult = executeInventoryTool(
      'get_product_details',
      { identifier: target },
      inventory,
      simulationDate
    );

    if (detailsResult.success && detailsResult.data) {
      const d: any = detailsResult.data;
      if (!d.found) {
        return {
          text: `${notice}**Product Not Found**\n\nNo product matching "${target}" was found in your active inventory. Please verify the product name in your inventory list.`,
          isRuleBased: true,
          provider: 'deterministic-fallback',
          model: 'rule-engine-v2',
          toolsUsed: ['get_product_details'],
        };
      }

      let resp = `${notice}### Product Record: ${d.name}\n\n`;
      resp += `- **Batch ID:** \`${d.id}\` | **Category:** ${d.category}\n`;
      resp += `- **Current Stock:** **${d.stockQuantity} ${d.unit}**\n`;

      if (d.hasExpiryDate) {
        const daysLabel =
          d.daysRemaining < 0
            ? `Expired ${Math.abs(d.daysRemaining)} days ago`
            : d.daysRemaining === 0
            ? 'Expires TODAY'
            : `${d.daysRemaining} days remaining`;
        resp += `- **Expiry Date:** **${d.expiryDate}** (${daysLabel})\n`;
        resp += `- **Status:** **${d.status}**\n`;
      } else {
        resp += `- **Expiry Date:** *No manufacturer expiry date recorded (Non-perishable staple commodity)*\n`;
        resp += `- **Status:** **SAFE (NO EXPIRY)**\n`;
      }

      resp += `- **Selling Price:** ${d.sellingPriceINR} | **Cost Price:** ${d.costPriceINR}\n`;

      if (d.hasDemandData) {
        resp += `- **Daily Demand Rate:** ${d.dailySalesDemand}\n`;
      }

      if (d.estimatedWasteCostINR) {
        resp += `- **Estimated Capital at Risk:** ${d.estimatedWasteCostINR}\n`;
      }

      resp += `- **Recommended Action:** ${d.recommendedAction}\n`;

      if (d.missingDataNotice) {
        resp += `\n*Note on missing data:* ${d.missingDataNotice}`;
      }

      return {
        text: resp,
        isRuleBased: true,
        provider: 'deterministic-fallback',
        model: 'rule-engine-v2',
        toolsUsed: ['get_product_details'],
      };
    }
  }

  // 4. Intent: Which product expires first?
  if (cleanQ.includes('expires first') || cleanQ.includes('earliest expiry') || cleanQ.includes('first to expire')) {
    const result = executeInventoryTool(
      'calculate_inventory_metrics',
      { metric: 'earliest_expiring' },
      inventory,
      simulationDate
    );

    if (result.success && result.data) {
      const d: any = result.data;
      if (!d.found) {
        return {
          text: `${notice}No products with recorded expiry dates found in your inventory.`,
          isRuleBased: true,
          provider: 'deterministic-fallback',
          model: 'rule-engine-v2',
          toolsUsed: ['calculate_inventory_metrics'],
        };
      }

      let resp = `${notice}### Earliest Expiring Product\n\n`;
      resp += `The batch nearest to expiry is **${d.productName}**.\n\n`;
      resp += `- **Expiry Date:** **${d.expiryDate}**\n`;
      resp += `- **Days Remaining:** **${d.daysRemaining} days** (${d.status})\n`;
      resp += `- **Stock on Hand:** ${d.quantity} ${d.unit}\n`;
      resp += `- **Recommended Action:** ${d.recommendedAction}`;

      return {
        text: resp,
        isRuleBased: true,
        provider: 'deterministic-fallback',
        model: 'rule-engine-v2',
        toolsUsed: ['calculate_inventory_metrics'],
      };
    }
  }

  // 5. Intent: Inventory cost / Capital at risk (check before general timeframe queries)
  if (cleanQ.includes('cost') || cleanQ.includes('value at risk') || cleanQ.includes('financial loss') || cleanQ.includes('loss')) {
    const result = executeInventoryTool(
      'calculate_inventory_metrics',
      { metric: 'at_risk_cost' },
      inventory,
      simulationDate
    );

    if (result.success && result.data) {
      const d: any = result.data;
      let resp = `${notice}### Estimated Cost of At-Risk Stock\n\n`;
      resp += `- **Total At-Risk Batches:** ${d.atRiskBatchesCount}\n`;
      resp += `- **Total Purchase Cost at Risk:** **${d.totalCostAtRiskINR}**\n`;
      resp += `\n*${d.note}*`;

      return {
        text: resp,
        isRuleBased: true,
        provider: 'deterministic-fallback',
        model: 'rule-engine-v2',
        toolsUsed: ['calculate_inventory_metrics'],
      };
    }
  }

  // 6. Intent: Products expiring this week / next 7 days / urgent
  if (
    cleanQ.includes('next seven days') ||
    cleanQ.includes('7 days') ||
    cleanQ.includes('this week') ||
    cleanQ.includes('expiring soon')
  ) {
    const result = executeInventoryTool(
      'query_inventory',
      { timeframe: 'this_week_7d', limit: 10 },
      inventory,
      simulationDate
    );

    if (result.success && result.data) {
      const d: any = result.data;
      let resp = `${notice}### Products Expiring in the Next 7 Days (${d.matchedCount} batches)\n\n`;
      if (d.items.length === 0) {
        resp += `Great news! You have **0 batches** expiring in the next 7 days.\n`;
      } else {
        d.items.forEach((item: any) => {
          resp += `- **${item.name}**: ${item.quantity} ${item.unit} (${item.daysRemaining}d left, Exp: ${item.expiryDate}) — *${item.status}*\n`;
        });
      }
      return {
        text: resp,
        isRuleBased: true,
        provider: 'deterministic-fallback',
        model: 'rule-engine-v2',
        toolsUsed: ['query_inventory'],
      };
    }
  }

  // 6. Intent: Missing expiry dates
  if (cleanQ.includes('missing expiry') || cleanQ.includes('no expiry') || cleanQ.includes('staple')) {
    const result = executeInventoryTool(
      'calculate_inventory_metrics',
      { metric: 'missing_expiry_count' },
      inventory,
      simulationDate
    );

    if (result.success && result.data) {
      const d: any = result.data;
      let resp = `${notice}### Products with No Expiry Date Recorded (${d.count} items)\n\n`;
      d.items.forEach((name: string) => {
        resp += `- **${name}**\n`;
      });
      resp += `\n*${d.note}*`;

      return {
        text: resp,
        isRuleBased: true,
        provider: 'deterministic-fallback',
        model: 'rule-engine-v2',
        toolsUsed: ['calculate_inventory_metrics'],
      };
    }
  }



  // 8. Intent: General search / query fallback
  const searchResult = executeInventoryTool('search_inventory', { query: cleanQ }, inventory, simulationDate);
  if (searchResult.success && (searchResult.data as any).totalMatches > 0) {
    const matches = (searchResult.data as any).matches;
    let resp = `${notice}### Inventory Matches for "${question}" (${matches.length} found)\n\n`;
    matches.forEach((m: any) => {
      resp += `- **${m.name}**: ${m.quantity} ${m.unit} | Expiry: ${m.expiryDate} (${m.daysRemaining !== null ? `${m.daysRemaining}d` : 'No expiry'}) | Status: **${m.status}**\n`;
    });
    return {
      text: resp,
      isRuleBased: true,
      provider: 'deterministic-fallback',
      model: 'rule-engine-v2',
      toolsUsed: ['search_inventory'],
    };
  }

  // Default: Overview of current inventory health
  const totalBatches = inventory.length;
  const expiredCount = inventory.filter((p) => {
    const days = calculateDaysRemaining(p.expiryDate, simulationDate);
    return days !== null && days < 0;
  }).length;
  const urgentCount = inventory.filter((p) => {
    const days = calculateDaysRemaining(p.expiryDate, simulationDate);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  return {
    text: `${notice}### Store Inventory Overview\n\n- **Total Batches:** ${totalBatches}\n- **Expired Batches:** ${expiredCount}\n- **At-Risk Batches (≤7 days):** ${urgentCount}\n\n**You can ask me specific questions such as:**\n- *"What is the expiry date of Amul Milk?"*\n- *"How much stock of bread is left?"*\n- *"Which product expires first?"*\n- *"What would happen if I discount milk by 15%?"*\n- *"How much inventory cost is at risk this week?"*`,
    isRuleBased: true,
    provider: 'deterministic-fallback',
    model: 'rule-engine-v2',
    toolsUsed: ['search_inventory'],
  };
}

/**
 * Main Agent Controller:
 * Dispatches to Gemini/OpenAI if configured, or runs the deterministic tool fallback.
 */
export async function runAIAgent(request: AgentRequest): Promise<AgentResponse> {
  const { question, history = [], inventory, simulationDate = SIMULATION_DATE, apiKeyOverride } = request;

  // 1. Check for configured server-side environment variables
  const proc = (globalThis as any).process;
  const geminiKey = apiKeyOverride || proc?.env?.GEMINI_API_KEY;
  const geminiModel = proc?.env?.GEMINI_MODEL || 'gemini-1.5-flash';

  const openAiKey = proc?.env?.OPENAI_API_KEY;
  const openAiModel = proc?.env?.OPENAI_MODEL || 'gpt-4o-mini';

  // 2. Try Gemini if key is present
  if (geminiKey && geminiKey.trim()) {
    try {
      return await callGeminiAgent(geminiKey.trim(), geminiModel, question, history, inventory, simulationDate);
    } catch (err) {
      console.warn('Gemini Agent call failed, falling back to deterministic tool engine:', err);
    }
  }

  // 3. Try OpenAI if key is present
  if (openAiKey && openAiKey.trim()) {
    try {
      return await callOpenAIAgent(openAiKey.trim(), openAiModel, question, history, inventory, simulationDate);
    } catch (err) {
      console.warn('OpenAI Agent call failed, falling back to deterministic tool engine:', err);
    }
  }

  // 4. Deterministic Tool Engine Fallback (Zero Hallucination)
  return runDeterministicToolFallback(question, history, inventory, simulationDate);
}
