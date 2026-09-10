import { createHash, randomUUID } from 'node:crypto';
import type { ProductDetailDto, WhatsAppOrderDto } from '@bandit/shared';
import { AppError } from '../errors/app-error.js';
import { orderRequestSchema, type OrderLine } from './schema.js';

export type SavedOrder = {
  requestId: string;
  requestHash: string;
  reference: string;
  message: string;
};
export type OrderSnapshot = SavedOrder & {
  customerId?: string | null;
  snapshot: { version: number; items: OrderLine[] };
  totalQuantity: number;
  subtotalMinor: number;
  quoteRequired: boolean;
};
export type OrderDependencies = {
  product: (slug: string) => Promise<ProductDetailDto>;
  find: (requestId: string) => Promise<SavedOrder | null>;
  save: (order: OrderSnapshot) => Promise<SavedOrder>;
};

const money = (minor: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(minor / 100);

function response(order: SavedOrder, hash: string): WhatsAppOrderDto {
  if (order.requestHash !== hash)
    throw new AppError(
      'This checkout reference belongs to a different cart. Please retry.',
      409,
      'ORDER_CHANGED'
    );
  return { reference: order.reference, message: order.message, phone: '2349137132516' };
}

export async function prepareOrder(
  input: unknown,
  dependencies: OrderDependencies,
  customerId: string | null = null
): Promise<WhatsAppOrderDto> {
  const request = orderRequestSchema.parse(input);
  const hash = createHash('sha256')
    .update(JSON.stringify({ customerId, items: request.items }))
    .digest('hex');
  const previous = await dependencies.find(request.requestId);
  if (previous) return response(previous, hash);
  const products = new Map<string, ProductDetailDto>();
  const quantities = new Map<string, number>();
  const lines: OrderLine[] = [];
  for (const item of request.items) {
    let name = `Custom ${item.material} wristbands`;
    let unitMinor: number | null = null;
    let requestedColor = false;
    let material = item.material;
    if (item.product) {
      let product = products.get(item.product.slug);
      if (!product) {
        product = await dependencies.product(item.product.slug);
        products.set(item.product.slug, product);
      }
      const variant = product.variants.find((v) => v.id === item.product?.variantId);
      if (product.id !== item.product.id || !variant)
        throw new AppError(
          'A wristband option is no longer available. Please update your cart.',
          409,
          'VARIANT_UNAVAILABLE'
        );
      name = product.name;
      material = variant.material ?? product.category.name;
      requestedColor = (variant.color ?? '').toLowerCase() !== item.colorName.toLowerCase();
      const custom = Boolean(item.message || item.subtitle || item.logo || item.logos?.length);
      // Unlisted colours and custom printing require staff pricing; never quote an unrelated variant.
      if (!requestedColor && !custom) {
        const count = (quantities.get(variant.id) ?? 0) + item.quantity;
        quantities.set(variant.id, count);
        if (count > variant.availableQuantity)
          throw new AppError(
            `Only ${variant.availableQuantity} units of ${product.name} (${variant.color ?? variant.name}) are available. Update your quantities.`,
            409,
            'INSUFFICIENT_STOCK'
          );
        const tier = [...product.pricingTiers]
          .sort((a, b) => b.minQuantity - a.minQuantity)
          .find((t) => t.minQuantity <= item.quantity);
        unitMinor = Math.round(
          ((tier?.unitPrice ?? product.basePrice) + variant.priceAdjustment) * 100
        );
        if (
          !Number.isSafeInteger(unitMinor) ||
          unitMinor < 0 ||
          !Number.isSafeInteger(unitMinor * item.quantity)
        )
          throw new AppError(
            'Price unavailable. Please contact the team.',
            409,
            'PRICE_UNAVAILABLE'
          );
      }
    }
    lines.push({
      ...item,
      material,
      name,
      requestedColor,
      unitMinor,
      totalMinor: unitMinor === null ? null : unitMinor * item.quantity,
    });
  }
  const subtotalMinor = lines.reduce((sum, line) => sum + (line.totalMinor ?? 0), 0);
  if (!Number.isSafeInteger(subtotalMinor))
    throw new AppError('Order total is too large.', 400, 'INVALID_TOTAL');
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const quoteRequired = lines.some((line) => line.totalMinor === null);
  const reference = `BIT-${randomUUID().toUpperCase()}`;
  const message = [
    'Hello BAND-IT, I would like to place this order.',
    '',
    `Order reference: ${reference}`,
    '',
    ...lines.flatMap((line, index) => [
      `${index + 1}. ${line.name}`,
      `Band type: ${line.material}`,
      `Colour: ${line.colorName}${line.requestedColor ? ' (requested; availability to be confirmed)' : ''}`,
      `Quantity: ${line.quantity.toLocaleString('en-NG')}`,
      `Unit price: ${line.unitMinor === null ? 'Quote required' : money(line.unitMinor)}`,
      `Subtotal: ${line.totalMinor === null ? 'Quote required' : money(line.totalMinor)}`,
      ...(!line.product || line.message || line.subtitle || line.logo || line.logos?.length
        ? [
            `Print text: ${line.message || '(none)'}`,
            `Subtitle: ${line.subtitle || '(none)'}`,
            `Print colour: ${line.ink}; font: ${line.font}`,
            `Artwork: ${line.logos?.length || (line.logo ? 1 : 0)} file(s) saved with order; not attached to WhatsApp`,
          ]
        : ['Printing: Plain / unprinted']),
      '',
    ]),
    `Total quantity: ${totalQuantity.toLocaleString('en-NG')} wristbands`,
    `${quoteRequired ? 'Priced items subtotal' : 'Items total'}: ${money(subtotalMinor)}`,
    ...(quoteRequired
      ? ['Additional items require a quote and are excluded from this subtotal.']
      : []),
    'Delivery fee: To be confirmed',
    'Payment: Not paid',
    'Please confirm availability, delivery and payment details.',
  ].join('\n');
  const saved = await dependencies.save({
    customerId,
    requestId: request.requestId,
    requestHash: hash,
    reference,
    message,
    snapshot: { version: 1, items: lines },
    totalQuantity,
    subtotalMinor,
    quoteRequired,
  });
  return response(saved, hash);
}
