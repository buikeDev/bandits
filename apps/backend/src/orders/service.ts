import { createHash, randomUUID } from 'node:crypto';
import type { ProductDetailDto, WhatsAppOrderDto } from '@bandit/shared';
import { AppError } from '../errors/app-error.js';
import { orderRequestSchema, type OrderRequest, type OrderLine } from './schema.js';

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
  fee?: () => Promise<number>;
  resolve?: (
    item: OrderRequest['items'][number]
  ) => Promise<{ product: ProductDetailDto; variantId: string }>;
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
  let message = order.message;
  // Enable only after the staff dashboard and its migration are deployed.
  if (process.env.ADMIN_DASHBOARD_URL) {
    const url = new URL(process.env.ADMIN_DASHBOARD_URL);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new AppError('Invalid staff dashboard configuration', 503, 'CONFIGURATION');
    message += `\n\nStaff order details (sign-in required): ${url.origin}/admin/orders/${encodeURIComponent(order.reference)}`;
  }
  return { reference: order.reference, message, phone: '2349137132516' };
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
  const { lines, subtotalMinor, totalQuantity } = await priceOrder(request, dependencies);
  if (
    request.expectedSubtotalMinor !== undefined &&
    request.expectedSubtotalMinor !== subtotalMinor
  )
    throw new AppError('Prices changed. Refresh your order before checkout.', 409, 'PRICE_CHANGED');
  const quoteRequired = false;
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
      `Material per band: ${money(line.materialUnitMinor ?? 0)}`,
      `Customisation per band: ${money(line.customizationUnitMinor ?? 0)}`,
      `Unit price: ${money(line.unitMinor!)}`,
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
    snapshot: { version: 2, items: lines },
    totalQuantity,
    subtotalMinor,
    quoteRequired,
  });
  return response(saved, hash);
}

export async function priceOrder(request: OrderRequest, dependencies: OrderDependencies) {
  const fee = (await dependencies.fee?.()) ?? 10000;
  if (!Number.isSafeInteger(fee) || fee < 0)
    throw new AppError('Pricing unavailable', 503, 'PRICE_UNAVAILABLE');
  const quantities = new Map<string, number>();
  const products = new Map<string, ProductDetailDto>();
  const lines: OrderLine[] = [];
  for (const original of request.items) {
    let item = original;
    let product: ProductDetailDto;
    if (!item.product) {
      if (!dependencies.resolve)
        throw new AppError('Select a stocked wristband first', 409, 'VARIANT_REQUIRED');
      const match = await dependencies.resolve(item);
      product = match.product;
      item = {
        ...item,
        product: { id: product.id, slug: product.slug, variantId: match.variantId },
      };
    } else {
      product = products.get(item.product.slug) ?? (await dependencies.product(item.product.slug));
      products.set(item.product.slug, product);
    }
    const variant = product.variants.find((v) => v.id === item.product!.variantId);
    if (product.id !== item.product!.id || !variant)
      throw new AppError(
        'A wristband option is no longer available. Update your cart.',
        409,
        'VARIANT_UNAVAILABLE'
      );
    if ((variant.color ?? '').toLowerCase() !== item.colorName.toLowerCase())
      throw new AppError(
        'Select an available colour for this wristband.',
        409,
        'COLOR_UNAVAILABLE'
      );
    const custom = Boolean(
      item.message.trim() || item.subtitle.trim() || item.logo || item.logos?.length
    );
    if (custom && !variant.isCustomizationEnabled)
      throw new AppError(
        'Printing is unavailable for this wristband option.',
        409,
        'CUSTOMIZATION_UNAVAILABLE'
      );
    const count = (quantities.get(variant.id) ?? 0) + item.quantity;
    quantities.set(variant.id, count);
    if (count > variant.availableQuantity)
      throw new AppError(
        'Only ' +
          variant.availableQuantity +
          ' units of ' +
          product.name +
          ' are available. Update your quantities.',
        409,
        'INSUFFICIENT_STOCK'
      );
    const tier = [...product.pricingTiers]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find((t) => t.minQuantity <= item.quantity);
    const materialUnitMinor = Math.round(
      ((tier?.unitPrice ?? product.basePrice) + variant.priceAdjustment) * 100
    );
    const customizationUnitMinor = custom ? fee : 0;
    const unitMinor = materialUnitMinor + customizationUnitMinor;
    if (
      !Number.isSafeInteger(unitMinor) ||
      unitMinor < 0 ||
      !Number.isSafeInteger(unitMinor * item.quantity)
    )
      throw new AppError('Price unavailable', 409, 'PRICE_UNAVAILABLE');
    lines.push({
      ...item,
      name: product.name,
      material: variant.material ?? product.category.name,
      requestedColor: false,
      materialUnitMinor,
      customizationUnitMinor,
      unitMinor,
      totalMinor: unitMinor * item.quantity,
    });
  }
  const subtotalMinor = lines.reduce((sum, line) => sum + line.totalMinor!, 0);
  if (!Number.isSafeInteger(subtotalMinor))
    throw new AppError('Order total is too large', 400, 'INVALID_TOTAL');
  return {
    lines,
    subtotalMinor,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    deliveryMinor: null,
  };
}
