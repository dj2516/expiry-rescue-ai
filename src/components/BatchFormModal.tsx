import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { ProductItem } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  initialData?: ProductItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<ProductItem, 'id'> | ProductItem) => void;
}

export const BatchFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('units');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setQuantity(initialData.quantity);
      setCostPrice(initialData.costPrice ?? '');
      setSellingPrice(initialData.sellingPrice ?? '');
      if (initialData.expiryDate) {
        setExpiryDate(initialData.expiryDate);
        setNoExpiry(false);
      } else {
        setExpiryDate('');
        setNoExpiry(true);
      }
      setCategory(initialData.category || '');
      setUnit(initialData.unit || 'units');
    } else {
      setName('');
      setQuantity(10);
      setCostPrice('');
      setSellingPrice('');
      setExpiryDate('');
      setNoExpiry(false);
      setCategory('Dairy & Eggs');
      setUnit('units');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (quantity === '' || isNaN(Number(quantity)) || Number(quantity) < 0) {
      newErrors.quantity = 'Stock quantity must be 0 or greater (no negative numbers allowed)';
    }

    if (costPrice !== '' && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }

    if (sellingPrice !== '' && (isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0)) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    }

    if (!noExpiry && expiryDate) {
      // Validate date
      const d = new Date(expiryDate);
      if (isNaN(d.getTime())) {
        newErrors.expiryDate = 'Please select a valid date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Omit<ProductItem, 'id'> = {
      name: name.trim(),
      quantity: Math.max(0, Number(quantity)),
      costPrice: costPrice !== '' ? Number(costPrice) : null,
      sellingPrice: sellingPrice !== '' ? Number(sellingPrice) : null,
      expiryDate: noExpiry ? null : (expiryDate.trim() ? expiryDate.trim() : null),
      category: category.trim() || undefined,
      unit: unit.trim() || 'units',
    };

    if (initialData?.id) {
      onSubmit({ ...payload, id: initialData.id });
    } else {
      onSubmit(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amul Taaza Milk 1L, Britannia Bread"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none transition-colors ${
                errors.name
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Stock Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-qty-input"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none transition-colors ${
                  errors.quantity
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              {errors.quantity && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit (Optional)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="packets, loaves, kg, units"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Prices (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price Per Unit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional, e.g. 54"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {errors.costPrice && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.costPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price Per Unit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional, e.g. 66"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {errors.sellingPrice && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.sellingPrice}</p>
              )}
            </div>
          </div>

          {/* Expiry Date Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Expiry Date
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noExpiry}
                  onChange={(e) => {
                    setNoExpiry(e.target.checked);
                    if (e.target.checked) setExpiryDate('');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>No Expiry (Staple / Non-perishable)</span>
              </label>
            </div>

            {!noExpiry && (
              <input
                id="product-expiry-input"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            )}
            {noExpiry && (
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Product has no expiry date (e.g. Tata Salt, Rice). It will not be marked as expiring.
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category (Optional)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="Dairy & Eggs">Dairy & Eggs</option>
              <option value="Bakery">Bakery</option>
              <option value="Staples & Grains">Staples & Grains</option>
              <option value="Packaged Food">Packaged Food</option>
              <option value="Snacks & Biscuits">Snacks & Biscuits</option>
              <option value="Cooking Oils">Cooking Oils</option>
              <option value="Spices & Masalas">Spices & Masalas</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-product-form-btn"
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              {initialData ? 'Update Product' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
