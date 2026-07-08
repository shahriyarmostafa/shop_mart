'use client';

import { Plus, X } from 'lucide-react';
import VariantImagePicker from '@/components/admin/VariantImagePicker';

export type VariantRow = {
  /** Client-only key for React lists / stable identity while editing - never sent to the server. */
  key: string;
  attributeName: string;
  value: string;
  priceModifier: string;
  stock: string;
  image: string;
};

export function emptyVariantRow(): VariantRow {
  return {
    key: Math.random().toString(36).slice(2),
    attributeName: '',
    value: '',
    priceModifier: '',
    stock: '',
    image: '',
  };
}

const SUGGESTED_ATTRIBUTES = ['Color', 'Size', 'Weight'];

type Props = {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
};

export default function VariantEditor({ variants, onChange }: Props) {
  function updateRow(key: string, patch: Partial<VariantRow>) {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function removeRow(key: string) {
    onChange(variants.filter((v) => v.key !== key));
  }

  function addRow() {
    onChange([...variants, emptyVariantRow()]);
  }

  const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);

  return (
    <div className="space-y-3">
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v) => (
            <div key={v.key} className="flex items-start gap-2 bg-ink-50/60 border border-ink-100 rounded-lg p-2.5">
              <VariantImagePicker image={v.image} onChange={(image) => updateRow(v.key, { image })} />

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-ink-400 mb-0.5 block">Attribute</label>
                  <input
                    list="variant-attribute-suggestions"
                    value={v.attributeName}
                    onChange={(e) => updateRow(v.key, { attributeName: e.target.value })}
                    placeholder="Color"
                    className="w-full border border-ink-100 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-marigold-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ink-400 mb-0.5 block">Value</label>
                  <input
                    value={v.value}
                    onChange={(e) => updateRow(v.key, { value: e.target.value })}
                    placeholder="Red"
                    className="w-full border border-ink-100 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-marigold-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ink-400 mb-0.5 block">Price +/- (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={v.priceModifier}
                    onChange={(e) => updateRow(v.key, { priceModifier: e.target.value })}
                    placeholder="0"
                    className="w-full border border-ink-100 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-marigold-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ink-400 mb-0.5 block">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={v.stock}
                    onChange={(e) => updateRow(v.key, { stock: e.target.value })}
                    placeholder="0"
                    className="w-full border border-ink-100 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-marigold-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeRow(v.key)}
                aria-label="Remove variant"
                className="text-ink-300 hover:text-spice transition-colors p-1.5 mt-4 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <datalist id="variant-attribute-suggestions">
        {SUGGESTED_ATTRIBUTES.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 text-sm border border-ink-100 hover:border-marigold-400 rounded-lg px-3 py-2 transition-colors"
      >
        <Plus size={16} /> Add Variant
      </button>

      {variants.length > 0 ? (
        <p className="text-xs text-ink-300">
          Total stock across variants: <span className="font-medium text-ink-500">{totalStock}</span> - this replaces the
          product-level stock field below.
        </p>
      ) : (
        <p className="text-xs text-ink-300">
          Optional. Add rows like Color: Red, Color: Blue, or Size: M, Size: L if this product comes in multiple options.
        </p>
      )}
    </div>
  );
}
