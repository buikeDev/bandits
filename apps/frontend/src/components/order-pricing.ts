export type OrderPricing = {
  basePrice: number;
  priceAdjustment: number;
  pricingTiers: Array<{ minQuantity: number; unitPrice: number }>;
};

export function calculatePrice(pricing: OrderPricing | undefined, quantity: number) {
  if (
    !pricing ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    !Number.isFinite(pricing.basePrice) ||
    pricing.basePrice < 0 ||
    !Number.isFinite(pricing.priceAdjustment) ||
    !Array.isArray(pricing.pricingTiers) ||
    !pricing.pricingTiers.every(
      (tier) =>
        Number.isInteger(tier.minQuantity) &&
        tier.minQuantity > 0 &&
        Number.isFinite(tier.unitPrice) &&
        tier.unitPrice >= 0
    )
  )
    return null;
  const tier = [...pricing.pricingTiers]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((item) => item.minQuantity <= quantity);
  const unitMinor = Math.round(
    ((tier?.unitPrice ?? pricing.basePrice) + pricing.priceAdjustment) * 100
  );
  if (
    !Number.isSafeInteger(unitMinor) ||
    unitMinor < 0 ||
    !Number.isSafeInteger(unitMinor * quantity)
  )
    return null;
  return { unit: unitMinor / 100, total: (unitMinor * quantity) / 100 };
}

export const formatOrderPrice = (value: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
