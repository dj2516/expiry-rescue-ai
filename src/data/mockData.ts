import type { ProductItem } from '../types/index.ts';

export const DEMO_DATA_LABEL = 'DEMO DATA — SYNTHETIC';

// Simulation reference date: 2026-10-17
const getRelativeDate = (offsetDays: number): string => {
  const base = new Date('2026-10-17T09:00:00Z');
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().split('T')[0];
};

export const INITIAL_PRODUCTS: ProductItem[] = [
  // 1. URGENT (expires tomorrow: +1 day)
  {
    id: 'prod-01',
    name: 'Amul Taaza Homogenised Milk 1L',
    quantity: 24,
    costPrice: 54,
    sellingPrice: 66,
    expiryDate: getRelativeDate(1),
    dailyDemand: 10,
    category: 'Dairy & Eggs',
    unit: 'pouches',
  },
  // 2. URGENT (expires tomorrow: +1 day)
  {
    id: 'prod-02',
    name: 'Britannia 100% Whole Wheat Bread 400g',
    quantity: 20,
    costPrice: 38,
    sellingPrice: 50,
    expiryDate: getRelativeDate(1),
    dailyDemand: 7,
    category: 'Bakery',
    unit: 'loaves',
  },
  // 3. URGENT (expires in 2 days: +2 days)
  {
    id: 'prod-03',
    name: 'Mother Dairy Classic Paneer 200g',
    quantity: 15,
    costPrice: 75,
    sellingPrice: 95,
    expiryDate: getRelativeDate(2),
    dailyDemand: 4,
    category: 'Dairy & Eggs',
    unit: 'packs',
  },
  // 4. URGENT (expires today: 0 days)
  {
    id: 'prod-04',
    name: 'Epigamia Greek Yogurt Natural 400g',
    quantity: 10,
    costPrice: 90,
    sellingPrice: 125,
    expiryDate: getRelativeDate(0),
    dailyDemand: 2,
    category: 'Dairy & Eggs',
    unit: 'cups',
  },
  // 5. URGENT (expires in 3 days: +3 days)
  {
    id: 'prod-05',
    name: 'Mother Dairy Dahi (Curd) 400g',
    quantity: 22,
    costPrice: 28,
    sellingPrice: 35,
    expiryDate: getRelativeDate(3),
    dailyDemand: 5,
    category: 'Dairy & Eggs',
    unit: 'tubs',
  },
  // 6. AT RISK (expires in 4 days: +4 days)
  {
    id: 'prod-06',
    name: 'Harvest Gold White Sandwich Bread 400g',
    quantity: 18,
    costPrice: 32,
    sellingPrice: 45,
    expiryDate: getRelativeDate(4),
    dailyDemand: 3,
    category: 'Bakery',
    unit: 'loaves',
  },
  // 7. AT RISK (expires in 6 days: +6 days)
  {
    id: 'prod-07',
    name: 'Amul Pasteurized Butter 500g',
    quantity: 16,
    costPrice: 230,
    sellingPrice: 275,
    expiryDate: getRelativeDate(6),
    dailyDemand: 1.5,
    category: 'Dairy & Eggs',
    unit: 'blocks',
  },
  // 8. AT RISK (expires in 7 days: +7 days)
  {
    id: 'prod-08',
    name: 'Britannia Fruit Cake 120g',
    quantity: 25,
    costPrice: 24,
    sellingPrice: 32,
    expiryDate: getRelativeDate(7),
    dailyDemand: 2,
    category: 'Bakery',
    unit: 'packs',
  },
  // 9. EXPIRED (expired 2 days ago: -2 days)
  {
    id: 'prod-09',
    name: 'Modern Sandwich Bread 400g',
    quantity: 6,
    costPrice: 30,
    sellingPrice: 42,
    expiryDate: getRelativeDate(-2),
    dailyDemand: 3,
    category: 'Bakery',
    unit: 'loaves',
  },
  // 10. EXPIRED (expired 1 day ago: -1 day)
  {
    id: 'prod-10',
    name: 'Nestlé A+ Nourish Dahi 400g',
    quantity: 4,
    costPrice: 38,
    sellingPrice: 48,
    expiryDate: getRelativeDate(-1),
    dailyDemand: 2,
    category: 'Dairy & Eggs',
    unit: 'tubs',
  },
  // 11. NO EXPIRY DATE (Staple: Tata Salt)
  {
    id: 'prod-11',
    name: 'Tata Salt Vacuum Evaporated Iodized 1kg',
    quantity: 75,
    costPrice: 22,
    sellingPrice: 28,
    expiryDate: null,
    dailyDemand: 12,
    category: 'Staples & Grains',
    unit: 'packets',
  },
  // 12. NO EXPIRY DATE (Staple: Basmati Rice)
  {
    id: 'prod-12',
    name: 'Daawat Rozana Super Basmati Rice 5kg',
    quantity: 20,
    costPrice: 360,
    sellingPrice: 440,
    expiryDate: null,
    dailyDemand: 2.5,
    category: 'Staples & Grains',
    unit: 'bags',
  },
  // 13. SAFE (expires in 25 days)
  {
    id: 'prod-13',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    quantity: 28,
    costPrice: 215,
    sellingPrice: 265,
    expiryDate: getRelativeDate(25),
    dailyDemand: 3.5,
    category: 'Staples & Grains',
    unit: 'bags',
  },
  // 14. SAFE (expires in 60 days)
  {
    id: 'prod-14',
    name: 'Maggi 2-Minute Masala Noodles 280g',
    quantity: 70,
    costPrice: 44,
    sellingPrice: 56,
    expiryDate: getRelativeDate(60),
    dailyDemand: 14,
    category: 'Packaged Food',
    unit: 'packs',
  },
  // 15. SAFE (expires in 45 days)
  {
    id: 'prod-15',
    name: 'Haldiram Nagpur Aloo Bhujia 400g',
    quantity: 26,
    costPrice: 85,
    sellingPrice: 115,
    expiryDate: getRelativeDate(45),
    dailyDemand: 4,
    category: 'Snacks & Biscuits',
    unit: 'packs',
  },
  // 16. SAFE (expires in 75 days)
  {
    id: 'prod-16',
    name: 'Parle-G Gold Biscuits 1kg Family Pack',
    quantity: 32,
    costPrice: 74,
    sellingPrice: 90,
    expiryDate: getRelativeDate(75),
    dailyDemand: 5,
    category: 'Snacks & Biscuits',
    unit: 'packs',
  },
  // 17. SAFE (expires in 90 days)
  {
    id: 'prod-17',
    name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    quantity: 30,
    costPrice: 118,
    sellingPrice: 142,
    expiryDate: getRelativeDate(90),
    dailyDemand: 4,
    category: 'Cooking Oils',
    unit: 'pouches',
  },
  // 18. SAFE (expires in 110 days)
  {
    id: 'prod-18',
    name: 'Kissan Fresh Tomato Ketchup 950g',
    quantity: 18,
    costPrice: 95,
    sellingPrice: 130,
    expiryDate: getRelativeDate(110),
    dailyDemand: 1.8,
    category: 'Sauces & Condiments',
    unit: 'bottles',
  },
  // 19. SAFE without demand (missing demand data demonstration)
  {
    id: 'prod-19',
    name: 'MDH Deggi Mirch Powder 100g',
    quantity: 24,
    costPrice: 62,
    sellingPrice: 85,
    expiryDate: getRelativeDate(45),
    dailyDemand: null, // DEMAND UNAVAILABLE
    category: 'Spices & Masalas',
    unit: 'boxes',
  },
  // 20. SAFE without cost data (missing cost demonstration)
  {
    id: 'prod-20',
    name: 'Loose Roasted Chana (Gram) 500g',
    quantity: 15,
    costPrice: null, // COST UNAVAILABLE
    sellingPrice: 60,
    expiryDate: getRelativeDate(30),
    dailyDemand: null,
    category: 'Snacks & Biscuits',
    unit: 'bags',
  },
];
