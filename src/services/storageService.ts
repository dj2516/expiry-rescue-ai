import {
  ProductItem,
  ProductAnalysis,
  DashboardMetrics,
  DataMode,
  analyzeProduct,
  SIMULATION_DATE,
} from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'expiry_rescue_kirana_products_v4',
  DATA_MODE: 'expiry_rescue_kirana_mode_v4',
};

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage, using fallback:`, error);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export const StorageService = {
  getDataMode(): DataMode {
    return getStoredItem<DataMode>(STORAGE_KEYS.DATA_MODE, 'demo');
  },

  setDataMode(mode: DataMode): void {
    setStoredItem(STORAGE_KEYS.DATA_MODE, mode);
  },

  getProducts(): ProductItem[] {
    return getStoredItem<ProductItem[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  saveProducts(products: ProductItem[]): void {
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  },

  addProduct(productData: Omit<ProductItem, 'id'>): ProductItem {
    const products = this.getProducts();
    const newProduct: ProductItem = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quantity: Math.max(0, Number(productData.quantity) || 0),
      costPrice: productData.costPrice !== undefined && productData.costPrice !== null && !isNaN(Number(productData.costPrice))
        ? Number(productData.costPrice)
        : null,
      sellingPrice: productData.sellingPrice !== undefined && productData.sellingPrice !== null && !isNaN(Number(productData.sellingPrice))
        ? Number(productData.sellingPrice)
        : null,
      expiryDate: productData.expiryDate && productData.expiryDate.trim() !== '' ? productData.expiryDate.trim() : null,
      dailyDemand: productData.dailyDemand !== undefined && productData.dailyDemand !== null && !isNaN(Number(productData.dailyDemand))
        ? Number(productData.dailyDemand)
        : null,
    };

    const updated = [newProduct, ...products];
    this.saveProducts(updated);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<ProductItem>): ProductItem | null {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = products[index];
    const updatedItem: ProductItem = {
      ...existing,
      ...updates,
      quantity: updates.quantity !== undefined ? Math.max(0, Number(updates.quantity) || 0) : existing.quantity,
      costPrice: updates.costPrice !== undefined
        ? (updates.costPrice !== null && !isNaN(Number(updates.costPrice)) ? Number(updates.costPrice) : null)
        : existing.costPrice,
      sellingPrice: updates.sellingPrice !== undefined
        ? (updates.sellingPrice !== null && !isNaN(Number(updates.sellingPrice)) ? Number(updates.sellingPrice) : null)
        : existing.sellingPrice,
      expiryDate: updates.expiryDate !== undefined
        ? (updates.expiryDate && updates.expiryDate.trim() !== '' ? updates.expiryDate.trim() : null)
        : existing.expiryDate,
      dailyDemand: updates.dailyDemand !== undefined
        ? (updates.dailyDemand !== null && !isNaN(Number(updates.dailyDemand)) ? Number(updates.dailyDemand) : null)
        : existing.dailyDemand,
    };

    products[index] = updatedItem;
    this.saveProducts(products);
    return updatedItem;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const initialLen = products.length;
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length !== initialLen) {
      this.saveProducts(filtered);
      return true;
    }
    return false;
  },

  resetToDemo(): void {
    setStoredItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStoredItem(STORAGE_KEYS.DATA_MODE, 'demo');
  },

  getDashboardMetrics(): DashboardMetrics {
    const products = this.getProducts();
    let batchesAtRisk = 0;
    let expiredBatches = 0;
    let totalWasteCost = 0;
    let hasAnyCostData = false;

    for (const product of products) {
      const analysis = analyzeProduct(product, SIMULATION_DATE);
      if (analysis.status === 'EXPIRED') {
        expiredBatches++;
      } else if (analysis.status === 'URGENT' || analysis.status === 'AT RISK') {
        batchesAtRisk++;
      }

      if (analysis.status === 'EXPIRED' || analysis.status === 'URGENT' || analysis.status === 'AT RISK') {
        if (analysis.estimatedWasteCost !== null) {
          totalWasteCost += analysis.estimatedWasteCost;
          hasAnyCostData = true;
        }
      }
    }

    return {
      totalBatches: products.length,
      batchesAtRisk,
      expiredBatches,
      estimatedCostAtRisk: hasAnyCostData ? Number(totalWasteCost.toFixed(2)) : null,
      hasReliableCost: hasAnyCostData,
    };
  },

  getProductsNeedingAttention(): ProductAnalysis[] {
    const products = this.getProducts();
    const analyzed = products.map((p) => analyzeProduct(p, SIMULATION_DATE));

    // Filter only those needing attention: EXPIRED, URGENT, AT RISK
    const needingAttention = analyzed.filter(
      (a) => a.status === 'EXPIRED' || a.status === 'URGENT' || a.status === 'AT RISK'
    );

    // Sort order: EXPIRED (most critical) -> URGENT (0-3 days) -> AT RISK (4-7 days)
    const priorityWeight = (status: string) => {
      if (status === 'EXPIRED') return 1;
      if (status === 'URGENT') return 2;
      if (status === 'AT RISK') return 3;
      return 4;
    };

    return needingAttention.sort((a, b) => {
      const pA = priorityWeight(a.status);
      const pB = priorityWeight(b.status);
      if (pA !== pB) return pA - pB;
      const daysA = a.daysRemaining ?? 999;
      const daysB = b.daysRemaining ?? 999;
      return daysA - daysB;
    });
  },

  getAllRecommendations(): ProductAnalysis[] {
    const products = this.getProducts();
    const analyzed = products.map((p) => analyzeProduct(p, SIMULATION_DATE));

    // Sort priority: EXPIRED (1) -> URGENT (2) -> AT RISK (3) -> SAFE (4) -> NO EXPIRY (5)
    const priorityWeight = (status: string) => {
      if (status === 'EXPIRED') return 1;
      if (status === 'URGENT') return 2;
      if (status === 'AT RISK') return 3;
      if (status === 'SAFE') return 4;
      return 5;
    };

    return analyzed.sort((a, b) => {
      const pA = priorityWeight(a.status);
      const pB = priorityWeight(b.status);
      if (pA !== pB) return pA - pB;
      const daysA = a.daysRemaining ?? 999;
      const daysB = b.daysRemaining ?? 999;
      return daysA - daysB;
    });
  },

  importCsv(csvText: string): { success: boolean; count: number; errors: string[] } {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, count: 0, errors: ['CSV file is empty or does not contain data rows.'] };
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    
    // Find column indices
    const nameIdx = header.findIndex((h) => h.includes('product') || h.includes('name') || h.includes('item'));
    const qtyIdx = header.findIndex((h) => h.includes('quantity') || h.includes('qty') || h.includes('stock'));
    const costIdx = header.findIndex((h) => h.includes('cost') || h.includes('purchase'));
    const priceIdx = header.findIndex((h) => h.includes('price') || h.includes('selling') || h.includes('retail') || h.includes('mrp'));
    const expiryIdx = header.findIndex((h) => h.includes('expiry') || h.includes('exp') || h.includes('date'));
    const demandIdx = header.findIndex((h) => h.includes('demand') || h.includes('sales') || h.includes('velocity'));

    if (nameIdx === -1) {
      return {
        success: false,
        count: 0,
        errors: ['Missing required column: "Product Name" (or Item Name).'],
      };
    }

    const errors: string[] = [];
    const newItems: ProductItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV split handling quotes
      const cells = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

      const name = cells[nameIdx];
      if (!name) {
        errors.push(`Row ${i + 1}: Skipped due to missing Product Name.`);
        continue;
      }

      let quantity = 0;
      if (qtyIdx !== -1 && cells[qtyIdx]) {
        const parsedQty = parseFloat(cells[qtyIdx]);
        if (isNaN(parsedQty) || parsedQty < 0) {
          errors.push(`Row ${i + 1} (${name}): Quantity "${cells[qtyIdx]}" must be a non-negative number. Defaulted to 0.`);
          quantity = 0;
        } else {
          quantity = parsedQty;
        }
      }

      let costPrice: number | null = null;
      if (costIdx !== -1 && cells[costIdx]) {
        const parsedCost = parseFloat(cells[costIdx].replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedCost) && parsedCost >= 0) {
          costPrice = parsedCost;
        }
      }

      let sellingPrice: number | null = null;
      if (priceIdx !== -1 && cells[priceIdx]) {
        const parsedPrice = parseFloat(cells[priceIdx].replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedPrice) && parsedPrice >= 0) {
          sellingPrice = parsedPrice;
        }
      }

      let expiryDate: string | null = null;
      if (expiryIdx !== -1 && cells[expiryIdx] && cells[expiryIdx].toLowerCase() !== 'null' && cells[expiryIdx].toLowerCase() !== 'n/a') {
        const rawDate = cells[expiryIdx].trim();
        // Check DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
          const [d, m, y] = rawDate.split('/');
          expiryDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          expiryDate = rawDate;
        } else {
          errors.push(`Row ${i + 1} (${name}): Date "${rawDate}" format unrecognized (use DD/MM/YYYY or YYYY-MM-DD). Expiry set to null.`);
        }
      }

      let dailyDemand: number | null = null;
      if (demandIdx !== -1 && cells[demandIdx]) {
        const parsedDemand = parseFloat(cells[demandIdx]);
        if (!isNaN(parsedDemand) && parsedDemand >= 0) {
          dailyDemand = parsedDemand;
        }
      }

      newItems.push({
        id: `csv-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        name,
        quantity,
        costPrice,
        sellingPrice,
        expiryDate,
        dailyDemand,
      });
    }

    if (newItems.length === 0) {
      return {
        success: false,
        count: 0,
        errors: errors.length > 0 ? errors : ['No valid product records found in CSV.'],
      };
    }

    this.saveProducts(newItems);
    this.setDataMode('real_shop');

    return {
      success: true,
      count: newItems.length,
      errors,
    };
  },
};
