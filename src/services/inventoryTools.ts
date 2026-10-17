import {
  type ProductItem,
  analyzeProduct,
  formatINR,
  formatIndianDate,
  calculateDaysRemaining,
  SIMULATION_DATE,
} from '../types/index.ts';

/**
 * Execution parameters and return types for genuine inventory tools.
 * All tools operate on live, verified application data.
 */

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  data: unknown;
  error?: string;
}

export const INVENTORY_TOOLS_DEFINITIONS = [
  {
    name: 'search_inventory',
    description:
      'Search inventory products by partial name, product ID, category, or expiry status. Returns matching product summaries.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword for product name or ID (e.g. "milk", "bread", "salt", "prod-01").',
        },
        status: {
          type: 'string',
          enum: ['EXPIRED', 'URGENT', 'AT RISK', 'SAFE', 'NO EXPIRY DATE', 'ALL'],
          description: 'Filter by risk status category.',
        },
        maxDaysRemaining: {
          type: 'number',
          description: 'Filter products expiring within this number of days (e.g. 7 for this week, 0 for today/expired).',
        },
      },
    },
  },
  {
    name: 'get_product_details',
    description:
      'Retrieve complete inventory details for a specific product or batch by name or ID. Returns stock, expiry date, days remaining, unit, cost, selling price, and risk status.',
    parameters: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Product name or ID to look up (e.g. "Amul Milk", "Britannia Bread", "prod-01").',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'query_inventory',
    description:
      'Query and filter inventory batches by timeframe, risk status, or missing fields. Useful for finding products expiring today, this week, or staple items with no expiry date.',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['today', 'urgent_3d', 'this_week_7d', 'expired', 'safe', 'no_expiry', 'all'],
          description: 'Preset timeframe filter.',
        },
        category: {
          type: 'string',
          description: 'Optional category filter (e.g. "Dairy & Eggs", "Bakery", "Staples & Grains").',
        },
        limit: {
          type: 'number',
          description: 'Max number of items to return (default 10).',
        },
      },
    },
  },
  {
    name: 'get_sales_history',
    description:
      'Retrieve historical daily sales velocity / demand for a product. Returns an explicit notification if sales data is unavailable.',
    parameters: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Product name or ID to check historical demand for.',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'calculate_inventory_metrics',
    description:
      'Calculate aggregate inventory figures using verified application math: total batches, at-risk capital value, expired count, total stock units, or earliest expiring batch.',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: [
            'total_batches',
            'at_risk_cost',
            'expired_count',
            'total_stock_units',
            'earliest_expiring',
            'missing_expiry_count',
            'category_summary',
          ],
          description: 'The specific metric to calculate.',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'calculate_scenario',
    description:
      'Calculate a hypothetical clearance discount or revenue scenario for a product. Clearly returns hypothetical outcomes derived from real recorded prices without altering actual store data.',
    parameters: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Product name or ID to calculate hypothetical discount for.',
        },
        discountPercent: {
          type: 'number',
          description: 'Percentage discount to model (e.g. 10 for 10%, 15 for 15%).',
        },
      },
      required: ['identifier', 'discountPercent'],
    },
  },
];

/**
 * Execute any of the 6 inventory tools against live application products.
 */
export function executeInventoryTool(
  toolName: string,
  args: Record<string, unknown> = {},
  products: ProductItem[],
  baseDate: string = SIMULATION_DATE
): ToolExecutionResult {
  try {
    switch (toolName) {
      case 'search_inventory': {
        const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
        const statusFilter = typeof args.status === 'string' ? args.status.toUpperCase() : 'ALL';
        const maxDays = typeof args.maxDaysRemaining === 'number' ? args.maxDaysRemaining : undefined;

        const results = products
          .map((p) => {
            const analysis = analyzeProduct(p, baseDate);
            return {
              id: p.id,
              name: p.name,
              category: p.category || 'General',
              quantity: p.quantity,
              unit: p.unit || 'units',
              expiryDate: p.expiryDate ? formatIndianDate(p.expiryDate) : 'No Expiry Date',
              daysRemaining: analysis.daysRemaining,
              status: analysis.status,
              sellingPrice: p.sellingPrice !== null && p.sellingPrice !== undefined ? formatINR(p.sellingPrice) : null,
              costPrice: p.costPrice !== null && p.costPrice !== undefined ? formatINR(p.costPrice) : null,
            };
          })
          .filter((item) => {
            if (query) {
              const matchesName = item.name.toLowerCase().includes(query);
              const matchesId = item.id.toLowerCase().includes(query);
              const matchesCategory = item.category.toLowerCase().includes(query);
              if (!matchesName && !matchesId && !matchesCategory) return false;
            }
            if (statusFilter && statusFilter !== 'ALL') {
              if (item.status !== statusFilter) return false;
            }
            if (maxDays !== undefined) {
              if (item.daysRemaining === null || item.daysRemaining > maxDays) return false;
            }
            return true;
          });

        return {
          tool: toolName,
          success: true,
          data: {
            totalMatches: results.length,
            matches: results.slice(0, 15),
          },
        };
      }

      case 'get_product_details': {
        const rawIdentifier = typeof args.identifier === 'string' ? args.identifier.trim().toLowerCase() : '';
        if (!rawIdentifier) {
          return { tool: toolName, success: false, data: null, error: 'Product identifier is required.' };
        }

        // Match by exact ID, or name contains
        const matched = products.find((p) => p.id.toLowerCase() === rawIdentifier)
          || products.find((p) => p.name.toLowerCase() === rawIdentifier)
          || products.find((p) => p.name.toLowerCase().includes(rawIdentifier))
          || products.find((p) => {
            const words = rawIdentifier.split(/\s+/).filter((w) => w.length > 2);
            return words.length > 0 && words.every((w) => p.name.toLowerCase().includes(w));
          });

        if (!matched) {
          return {
            tool: toolName,
            success: true,
            data: {
              found: false,
              message: `No product matching "${args.identifier}" found in active inventory. Available products include: ${products.slice(0, 5).map((p) => p.name).join(', ')}...`,
            },
          };
        }

        const analysis = analyzeProduct(matched, baseDate);
        return {
          tool: toolName,
          success: true,
          data: {
            found: true,
            id: matched.id,
            name: matched.name,
            category: matched.category || 'General',
            stockQuantity: matched.quantity,
            unit: matched.unit || 'units',
            expiryDate: matched.expiryDate ? formatIndianDate(matched.expiryDate) : null,
            hasExpiryDate: matched.expiryDate !== null && matched.expiryDate !== undefined,
            daysRemaining: analysis.daysRemaining,
            status: analysis.status,
            costPriceINR: matched.costPrice !== null && matched.costPrice !== undefined ? formatINR(matched.costPrice) : 'Not recorded',
            sellingPriceINR: matched.sellingPrice !== null && matched.sellingPrice !== undefined ? formatINR(matched.sellingPrice) : 'Not recorded',
            hasCostPrice: matched.costPrice !== null && matched.costPrice !== undefined,
            hasSellingPrice: matched.sellingPrice !== null && matched.sellingPrice !== undefined,
            dailySalesDemand: matched.dailyDemand !== null && matched.dailyDemand !== undefined ? `${matched.dailyDemand} ${matched.unit || 'units'}/day` : 'Not recorded (unavailable)',
            hasDemandData: matched.dailyDemand !== null && matched.dailyDemand !== undefined,
            estimatedUnsoldUnits: analysis.estimatedUnsoldUnits,
            estimatedWasteCostINR: analysis.estimatedWasteCost !== null ? formatINR(analysis.estimatedWasteCost) : null,
            recommendedAction: analysis.recommendedAction,
            reasonExplanation: analysis.reasonExplanation,
            missingDataNotice: analysis.missingDataNotice,
          },
        };
      }

      case 'query_inventory': {
        const timeframe = typeof args.timeframe === 'string' ? args.timeframe : 'all';
        const category = typeof args.category === 'string' ? args.category.toLowerCase() : '';
        const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(25, args.limit)) : 10;

        let filtered = products.map((p) => ({
          product: p,
          analysis: analyzeProduct(p, baseDate),
        }));

        if (category) {
          filtered = filtered.filter(({ product }) => product.category?.toLowerCase().includes(category));
        }

        switch (timeframe) {
          case 'today':
            filtered = filtered.filter(({ analysis }) => analysis.daysRemaining === 0);
            break;
          case 'urgent_3d':
            filtered = filtered.filter(({ analysis }) => analysis.daysRemaining !== null && analysis.daysRemaining >= 0 && analysis.daysRemaining <= 3);
            break;
          case 'this_week_7d':
            filtered = filtered.filter(({ analysis }) => analysis.daysRemaining !== null && analysis.daysRemaining >= 0 && analysis.daysRemaining <= 7);
            break;
          case 'expired':
            filtered = filtered.filter(({ analysis }) => analysis.status === 'EXPIRED');
            break;
          case 'safe':
            filtered = filtered.filter(({ analysis }) => analysis.status === 'SAFE');
            break;
          case 'no_expiry':
            filtered = filtered.filter(({ analysis }) => analysis.status === 'NO EXPIRY DATE');
            break;
          default:
            break;
        }

        // Sort by days remaining (earliest first, nulls at bottom)
        filtered.sort((a, b) => {
          if (a.analysis.daysRemaining === null) return 1;
          if (b.analysis.daysRemaining === null) return -1;
          return a.analysis.daysRemaining - b.analysis.daysRemaining;
        });

        const items = filtered.slice(0, limit).map(({ product, analysis }) => ({
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          unit: product.unit || 'units',
          expiryDate: formatIndianDate(product.expiryDate),
          daysRemaining: analysis.daysRemaining,
          status: analysis.status,
          sellingPrice: product.sellingPrice ? formatINR(product.sellingPrice) : '—',
          costPrice: product.costPrice ? formatINR(product.costPrice) : '—',
          recommendedAction: analysis.recommendedAction,
        }));

        return {
          tool: toolName,
          success: true,
          data: {
            timeframe,
            matchedCount: filtered.length,
            items,
          },
        };
      }

      case 'get_sales_history': {
        const rawId = typeof args.identifier === 'string' ? args.identifier.trim().toLowerCase() : '';
        if (!rawId) {
          return { tool: toolName, success: false, data: null, error: 'Product identifier is required.' };
        }

        const matched = products.find((p) => p.name.toLowerCase().includes(rawId) || p.id.toLowerCase() === rawId);
        if (!matched) {
          return {
            tool: toolName,
            success: true,
            data: {
              found: false,
              message: `Product "${args.identifier}" was not found in inventory.`,
            },
          };
        }

        if (matched.dailyDemand === null || matched.dailyDemand === undefined || isNaN(matched.dailyDemand)) {
          return {
            tool: toolName,
            success: true,
            data: {
              productName: matched.name,
              salesHistoryAvailable: false,
              message: `No sales velocity or historical daily demand data recorded for ${matched.name}. Projected sales or leftover units cannot be calculated with certainty.`,
            },
          };
        }

        const days = calculateDaysRemaining(matched.expiryDate, baseDate);
        const daysRunway = days !== null && days > 0 ? days : 1;
        const expectedSales = Math.min(matched.quantity, Math.floor(matched.dailyDemand * daysRunway));
        const leftover = Math.max(0, matched.quantity - expectedSales);

        return {
          tool: toolName,
          success: true,
          data: {
            productName: matched.name,
            salesHistoryAvailable: true,
            dailySalesRate: `${matched.dailyDemand} ${matched.unit || 'units'} per day`,
            currentStock: matched.quantity,
            daysRemaining: days,
            expectedSalesBeforeExpiry: expectedSales,
            projectedUnsoldUnits: leftover,
          },
        };
      }

      case 'calculate_inventory_metrics': {
        const metric = typeof args.metric === 'string' ? args.metric : 'total_batches';
        const analyses = products.map((p) => analyzeProduct(p, baseDate));

        switch (metric) {
          case 'total_batches':
            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'total_batches',
                value: products.length,
                description: `${products.length} active product batches registered in inventory.`,
              },
            };

          case 'at_risk_cost': {
            const atRiskItems = analyses.filter((a) => a.status === 'URGENT' || a.status === 'AT RISK');
            let totalCost = 0;
            let missingCostItems: string[] = [];

            atRiskItems.forEach((item) => {
              if (item.estimatedWasteCost !== null) {
                totalCost += item.estimatedWasteCost;
              } else {
                missingCostItems.push(item.product.name);
              }
            });

            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'at_risk_cost',
                atRiskBatchesCount: atRiskItems.length,
                totalCostAtRiskINR: formatINR(totalCost),
                rawAmount: totalCost,
                missingCostItemsCount: missingCostItems.length,
                missingCostItems,
                note: missingCostItems.length > 0 ? `${missingCostItems.length} at-risk items do not have purchase cost recorded.` : 'All at-risk items have recorded purchase costs.',
              },
            };
          }

          case 'expired_count': {
            const expired = analyses.filter((a) => a.status === 'EXPIRED');
            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'expired_count',
                count: expired.length,
                expiredProducts: expired.map((e) => ({
                  name: e.product.name,
                  quantity: e.product.quantity,
                  expiredDaysAgo: Math.abs(e.daysRemaining || 0),
                  expiryDate: formatIndianDate(e.product.expiryDate),
                  costExposure: e.estimatedWasteCost ? formatINR(e.estimatedWasteCost) : 'Cost unrecorded',
                })),
              },
            };
          }

          case 'total_stock_units': {
            const totalUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'total_stock_units',
                totalUnits,
                averagePerBatch: products.length > 0 ? (totalUnits / products.length).toFixed(1) : 0,
              },
            };
          }

          case 'earliest_expiring': {
            const itemsWithExpiry = analyses
              .filter((a) => a.daysRemaining !== null)
              .sort((a, b) => (a.daysRemaining as number) - (b.daysRemaining as number));

            if (itemsWithExpiry.length === 0) {
              return {
                tool: toolName,
                success: true,
                data: {
                  metric: 'earliest_expiring',
                  found: false,
                  message: 'No products with recorded expiry dates found in inventory.',
                },
              };
            }

            const earliest = itemsWithExpiry[0];
            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'earliest_expiring',
                found: true,
                productName: earliest.product.name,
                daysRemaining: earliest.daysRemaining,
                status: earliest.status,
                expiryDate: formatIndianDate(earliest.product.expiryDate),
                quantity: earliest.product.quantity,
                unit: earliest.product.unit || 'units',
                isAlreadyExpired: (earliest.daysRemaining as number) < 0,
                recommendedAction: earliest.recommendedAction,
              },
            };
          }

          case 'missing_expiry_count': {
            const missing = analyses.filter((a) => a.status === 'NO EXPIRY DATE');
            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'missing_expiry_count',
                count: missing.length,
                items: missing.map((m) => m.product.name),
                note: 'These are non-perishable staple goods (e.g. Tata Salt, Daawat Basmati Rice) with zero spoilage risk.',
              },
            };
          }

          case 'category_summary': {
            const breakdown: Record<string, { count: number; totalUnits: number }> = {};
            products.forEach((p) => {
              const cat = p.category || 'Other';
              if (!breakdown[cat]) breakdown[cat] = { count: 0, totalUnits: 0 };
              breakdown[cat].count += 1;
              breakdown[cat].totalUnits += p.quantity;
            });
            return {
              tool: toolName,
              success: true,
              data: {
                metric: 'category_summary',
                categories: breakdown,
              },
            };
          }

          default:
            return { tool: toolName, success: false, data: null, error: `Unsupported metric type: ${metric}` };
        }
      }

      case 'calculate_scenario': {
        const rawId = typeof args.identifier === 'string' ? args.identifier.trim().toLowerCase() : '';
        const discountPct = typeof args.discountPercent === 'number' ? Math.max(0, Math.min(100, args.discountPercent)) : 10;

        if (!rawId) {
          return { tool: toolName, success: false, data: null, error: 'Product identifier is required.' };
        }

        const matched = products.find((p) => p.name.toLowerCase().includes(rawId) || p.id.toLowerCase() === rawId);
        if (!matched) {
          return {
            tool: toolName,
            success: true,
            data: {
              found: false,
              message: `Product "${args.identifier}" not found in inventory.`,
            },
          };
        }

        if (matched.sellingPrice === null || matched.sellingPrice === undefined) {
          return {
            tool: toolName,
            success: true,
            data: {
              found: true,
              productName: matched.name,
              calculable: false,
              message: `Selling price is not recorded for ${matched.name}. Cannot calculate hypothetical discount without base selling price.`,
            },
          };
        }

        const baseSellingPrice = matched.sellingPrice;
        const discountAmount = Number(((baseSellingPrice * discountPct) / 100).toFixed(2));
        const discountedPrice = Math.max(0, Number((baseSellingPrice - discountAmount).toFixed(2)));
        const cost = matched.costPrice;
        const marginPerUnit = cost !== null && cost !== undefined ? Number((discountedPrice - cost).toFixed(2)) : null;
        const totalPotentialRevenue = Number((discountedPrice * matched.quantity).toFixed(2));

        return {
          tool: toolName,
          success: true,
          data: {
            scenarioType: 'HYPOTHETICAL_MARKDOWN_SIMULATION',
            isActualOutcome: false,
            productName: matched.name,
            currentStock: matched.quantity,
            unit: matched.unit || 'units',
            originalPriceINR: formatINR(baseSellingPrice),
            discountPercentage: `${discountPct}%`,
            discountAmountINR: formatINR(discountAmount),
            newDiscountedPriceINR: formatINR(discountedPrice),
            unitPurchaseCostINR: cost !== null && cost !== undefined ? formatINR(cost) : 'Not recorded',
            marginPerUnitINR: marginPerUnit !== null ? formatINR(marginPerUnit) : 'Unknown (cost not recorded)',
            isProfitablePerUnit: marginPerUnit !== null ? marginPerUnit >= 0 : null,
            projectedStockRevenueINR: formatINR(totalPotentialRevenue),
            note: 'This is a mathematical simulation using recorded shelf prices. It does not alter stored inventory data.',
          },
        };
      }

      default:
        return {
          tool: toolName,
          success: false,
          data: null,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (err) {
    return {
      tool: toolName,
      success: false,
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
