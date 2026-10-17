import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, IndianRupee, Package } from 'lucide-react';
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
    if (!isOpen) return;

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
      setCategory(initialData.category || 'Dairy & Eggs');
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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (quantity === '' || isNaN(Number(quantity)) || Number(quantity) < 0) {
      newErrors.quantity = 'Stock quantity must be 0 or greater (no negative numbers)';
    }

    if (costPrice !== '' && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }

    if (sellingPrice !== '' && (isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0)) {
      newErrors.sellingPrice = 'Selling price cannot be negative';
    }

    if (!noExpiry && expiryDate) {
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                {initialData ? 'Edit Product Batch' : 'Add New Product Batch'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {initialData ? `Updating ${initialData.name}` : 'Enter product details, pricing, and expiry date'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amul Taaza Milk 1L, Britannia 100% Bread"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none transition-colors ${
                errors.name
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300 focus:border-emerald-600 focus:bg-white'
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
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-qty-input"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                }
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none transition-colors font-mono tabular-nums ${
                  errors.quantity
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:border-emerald-600 focus:bg-white'
                }`}
              />
              {errors.quantity && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Unit (Optional)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="units, packets, kg, loaves"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Prices (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-slate-500" />
                <span>Cost Price Per Unit (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) =>
                  setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Optional, e.g. 54"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none font-mono tabular-nums"
              />
              {errors.costPrice && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.costPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-slate-500" />
                <span>Selling Price (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) =>
                  setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Optional, e.g. 66"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none font-mono tabular-nums"
              />
              {errors.sellingPrice && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.sellingPrice}</p>
              )}
            </div>
          </div>

          {/* Expiry Date Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Expiry Date</span>
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
                <span className="text-[11px] font-medium">No Expiry (Staple commodity)</span>
              </label>
            </div>

            {!noExpiry && (
              <input
                id="product-expiry-input"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none font-mono tabular-nums"
              />
            )}
            {noExpiry && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Non-perishable staple (e.g. Tata Salt, Basmati Rice). Spoilage risk is zero.
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none bg-white"
            >
              <option value="Dairy & Eggs">Dairy & Eggs</option>
              <option value="Bakery">Bakery</option>
              <option value="Staples & Grains">Staples & Grains</option>
              <option value="Packaged Food">Packaged Food</option>
              <option value="Snacks & Biscuits">Snacks & Biscuits</option>
              <option value="Cooking Oils">Cooking Oils</option>
              <option value="Spices & Masalas">Spices & Masalas</option>
              <option value="Sauces & Condiments">Sauces & Condiments</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-product-form-btn"
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              {initialData ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
