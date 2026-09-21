'use client';

import { wristbandColorHex } from '@bandit/shared';
import PurchaseControls from './PurchaseControls';
import Image from 'next/image';

import type { ProductDetailDto } from '@bandit/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDesignOrder } from './DesignOrderProvider';
import { useCartFeedback } from './useCartFeedback';

export default function WristbandOptions({
  product,
  onColorChange,
}: {
  product: ProductDetailDto;
  onColorChange: (color: { name: string; hex: string }) => void;
}) {
  const router = useRouter();
  const { adding, busy, confirm } = useCartFeedback();
  const { add, items, ready, error: saveError } = useDesignOrder();
  const [variantId, setVariantId] = useState(
    product.variants.find((item) => item.availableQuantity > 0)?.id ?? product.variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState('1');
  const [requestedColor, setRequestedColor] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const variant = product.variants.find((item) => item.id === variantId);
  const selectedColor = requestedColor || variant?.color || 'Yellow';
  const selectedHex = wristbandColorHex(selectedColor);
  useEffect(() => {
    onColorChange({ name: selectedColor, hex: selectedHex });
  }, [selectedColor, selectedHex, onColorChange]);
  const units = Number(quantity);
  const alreadyAdded = items
    .filter((item) => item.product?.variantId === variantId)
    .reduce((sum, item) => sum + item.quantity, 0);
  const remaining = Math.max(0, (variant?.availableQuantity ?? 0) - alreadyAdded);
  const valid = Number.isInteger(units) && units >= 1 && units <= Math.min(remaining, 100000);
  const tier = [...product.pricingTiers]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((item) => item.minQuantity <= units);
  const unitPrice = (tier?.unitPrice ?? product.basePrice) + (variant?.priceAdjustment ?? 0);

  async function addToOrder(placeOrder: boolean, button: HTMLButtonElement) {
    if (busy.current) return;
    setError('');
    setNotice('');
    if (!variant || !valid) {
      setError(
        `Choose an available colour and enter a whole-number quantity between 1 and ${Math.min(remaining, 100000)}.`
      );
      return;
    }
    const saved = add({
      material: variant.material ?? product.category.name,
      colorName: selectedColor,
      color: selectedHex,
      ink: selectedColor.toLowerCase() === 'black' ? '#ffffff' : '#171717',
      message: '',
      subtitle: '',
      font: 'Arial, Helvetica, sans-serif',
      logo: '',
      quantity: units,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        variantId: variant.id,
        variantName: requestedColor
          ? `Requested ${selectedColor} — colour availability to be confirmed`
          : variant.name,
        availableQuantity: variant.availableQuantity,
        pricing: {
          basePrice: product.basePrice,
          priceAdjustment: variant.priceAdjustment,
          pricingTiers: product.pricingTiers,
        },
      },
    });
    if (!saved) return;
    setNotice(`${units} wristbands added to your order.`);
    if (!(await confirm(button, selectedHex))) return;
    if (placeOrder) router.push('/order#checkout-status');
    else setNotice(`${units} wristbands added to your order.`);
  }

  return (
    <>
      {variant?.imageUrl && (
        <div className="relative mb-4 h-40 overflow-hidden rounded-lg bg-white">
          <Image
            src={variant.imageUrl}
            alt={`${product.name} — ${variant.name}`}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      )}
      <label className="mb-4 block text-sm font-semibold">
        Wristband option (colour / size)
        <select
          className="mt-2 min-h-11 w-full rounded-lg border p-3"
          value={variantId}
          onChange={(e) => {
            setVariantId(e.target.value);
            setRequestedColor('');
          }}
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id} disabled={!v.availableQuantity}>
              {v.name} {v.size} — {v.availableQuantity} available
            </option>
          ))}
        </select>
      </label>
      <PurchaseControls
        product={product}
        selectedColor={selectedColor}
        quantity={quantity}
        remaining={remaining}
        valid={valid}
        unitPrice={unitPrice}
        ready={ready}
        adding={adding}
        requestedColor={requestedColor}
        error={error}
        saveError={saveError}
        notice={notice}
        onQuantity={setQuantity}
        onAdd={addToOrder}
        onChoose={(name) => {
          const match = product.variants.find(
            (v) => v.color?.toLowerCase() === name.toLowerCase() && v.availableQuantity > 0
          );
          if (match) {
            setVariantId(match.id);
            setRequestedColor(String());
          } else {
            setRequestedColor(name);
          }
          setError(String());
          setNotice(String());
        }}
      />
    </>
  );
}
