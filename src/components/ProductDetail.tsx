'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import AddToCartPanel from '@/components/AddToCartPanel';
import { formatPrice, discountPercent } from '@/lib/utils';

export type VariantOption = {
  id: string;
  attributeName: string;
  value: string;
  priceModifier: number;
  stock: number;
  image: string | null;
};

type Props = {
  id: string;
  name: string;
  description: string;
  images: string[];
  variants: VariantOption[];
  price: number;
  compareAtPrice: number | null;
  /** Base/aggregate stock - used directly when there are no variants. */
  stock: number;
  rating: number;
  reviewCount: number;
};

/** Groups variants by attributeName, preserving first-seen order (variants already arrive sorted by sortOrder). */
function groupVariants(variants: VariantOption[]): { name: string; options: VariantOption[] }[] {
  const order: string[] = [];
  const byName = new Map<string, VariantOption[]>();
  for (const v of variants) {
    if (!byName.has(v.attributeName)) {
      byName.set(v.attributeName, []);
      order.push(v.attributeName);
    }
    byName.get(v.attributeName)!.push(v);
  }
  return order.map((name) => ({ name, options: byName.get(name)! }));
}

export default function ProductDetail({
  id,
  name,
  description,
  images,
  variants,
  price,
  compareAtPrice,
  stock,
  rating,
  reviewCount,
}: Props) {
  const groups = useMemo(() => groupVariants(variants), [variants]);

  // One selected variant id per attribute group, e.g. { Color: 'v_red', Size: 'v_xl' }.
  // Defaults to the first option in each group so price/stock/image are always valid, not blank.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const g of groups) initial[g.name] = g.options[0].id;
    return initial;
  });

  const selectedVariants = useMemo(
    () =>
      Object.values(selected)
        .map((vid) => variants.find((v) => v.id === vid))
        .filter((v): v is VariantOption => !!v),
    [selected, variants]
  );

  function imageForSelection(sel: Record<string, string>): string {
    for (const g of groups) {
      const v = variants.find((x) => x.id === sel[g.name]);
      if (v?.image) return v.image;
    }
    return images[0];
  }

  const [mainImage, setMainImage] = useState<string>(() => imageForSelection(selected));

  // A variant selection always wins over whatever thumbnail the shopper was
  // browsing - clicking "Red" should always show the red photo.
  useEffect(() => {
    setMainImage(imageForSelection(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const effectivePrice = Math.max(0, price + selectedVariants.reduce((sum, v) => sum + (v.priceModifier || 0), 0));
  const effectiveStock = selectedVariants.length > 0 ? Math.min(...selectedVariants.map((v) => v.stock)) : stock;
  const variantLabel = selectedVariants.length
    ? selectedVariants.map((v) => `${v.attributeName}: ${v.value}`).join(', ')
    : undefined;
  const variantIds = selectedVariants.length ? selectedVariants.map((v) => v.id) : undefined;
  const discount = discountPercent(effectivePrice, compareAtPrice);

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div>
        <div className="relative aspect-square rounded-xl overflow-hidden bg-ink-50">
          <SafeImage src={mainImage} alt={name} fill sizes="500px" className="object-cover" />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3 mt-3">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMainImage(img)}
                aria-label={`Show photo ${i + 1}`}
                className={`relative aspect-square rounded-lg overflow-hidden bg-ink-50 border-2 transition-colors ${
                  mainImage === img ? 'border-marigold-400' : 'border-transparent hover:border-ink-100'
                }`}
              >
                <SafeImage src={img} alt={`${name} ${i + 1}`} fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">{name}</h1>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-sm text-ink-500">
            <Star size={14} className="fill-marigold-400 text-marigold-400" />
            {rating.toFixed(1)}
          </div>
          <span className="text-ink-300 text-sm">({reviewCount} reviews)</span>
          <span className="text-ink-300">•</span>
          <span className={`text-sm font-medium ${effectiveStock > 0 ? 'text-leaf' : 'text-spice'}`}>
            {effectiveStock > 0 ? `${effectiveStock} in stock` : 'Out of stock'}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <span className="price-tag bg-ink text-white font-mono text-xl font-semibold">{formatPrice(effectivePrice)}</span>
          {compareAtPrice && discount && (
            <>
              <span className="text-ink-300 line-through font-mono">{formatPrice(compareAtPrice)}</span>
              <span className="bg-spice/10 text-spice text-xs font-bold px-2 py-1 rounded">-{discount}%</span>
            </>
          )}
        </div>

        {groups.length > 0 && (
          <div className="mt-5 space-y-4">
            {groups.map((g) => (
              <div key={g.name}>
                <span className="text-sm text-ink-500 mb-2 block">
                  {g.name}
                  {selected[g.name] && (
                    <span className="text-ink-700 font-medium">
                      {' '}
                      - {variants.find((v) => v.id === selected[g.name])?.value}
                    </span>
                  )}
                </span>
                <div className="flex flex-wrap gap-2">
                  {g.options.map((opt) => {
                    const isActive = selected[g.name] === opt.id;
                    const outOfStock = opt.stock === 0;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelected((s) => ({ ...s, [g.name]: opt.id }))}
                        aria-pressed={isActive}
                        aria-label={`${g.name}: ${opt.value}${outOfStock ? ' (out of stock)' : ''}`}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                          isActive
                            ? 'border-marigold-400 bg-marigold-400/10 text-ink'
                            : 'border-ink-100 text-ink-500 hover:border-ink-300'
                        } ${outOfStock ? 'opacity-40 line-through' : ''}`}
                      >
                        {opt.value}
                        {opt.priceModifier ? (
                          <span className="ml-1 text-xs text-ink-300">
                            ({opt.priceModifier > 0 ? '+' : ''}
                            {formatPrice(opt.priceModifier)})
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-ink-500 mt-5 leading-relaxed">{description}</p>

        <AddToCartPanel
          productId={id}
          name={name}
          price={effectivePrice}
          image={mainImage}
          stock={effectiveStock}
          variantIds={variantIds}
          variantLabel={variantLabel}
        />

        <div className="mt-6 border-t border-ink-50 pt-5 text-sm text-ink-400 space-y-1.5">
          <p>✓ Cash on Delivery available</p>
          <p>✓ 7-day easy return policy</p>
          <p>✓ Genuine product guarantee</p>
        </div>
      </div>
    </div>
  );
}
