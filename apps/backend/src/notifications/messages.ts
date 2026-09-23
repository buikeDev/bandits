export function customerUpdate(
  reference: string,
  status: string,
  method?: string,
  tracking?: string
): string {
  const messages: Record<string, string> = {
    RECEIVED:
      'We have saved your order. Please send your checkout message on WhatsApp to arrange payment and delivery. Payment is not yet confirmed.',
    AWAITING_WHATSAPP:
      'We have saved your order. Please contact us on WhatsApp to arrange payment and delivery.',
    CONFIRMED: 'Your order has been accepted. Payment confirmation is a separate update.',
    PAYMENT_CONFIRMED:
      'Your payment has been verified and the current order balance is settled. Thank you!',
    IN_PRODUCTION: 'Your order is being prepared.',
    READY:
      method === 'COLLECTION'
        ? 'Your order is ready for pickup. Please contact us to arrange collection.'
        : 'Your order is ready for dispatch.',
    DISPATCHED: 'Your order is on route.',
    COMPLETED:
      method === 'COLLECTION'
        ? 'Your order has been collected. Thank you for choosing BAND-IT!'
        : 'Your order has been marked delivered. Thank you for choosing BAND-IT!',
    CANCELLED: 'Your order has been cancelled. Please contact us if you have any questions.',
  };
  return [
    `BAND-IT order ${reference}`,
    messages[status] ?? 'Please contact us for an update on your order.',
    ...(status === 'DISPATCHED' && tracking
      ? [`Tracking / delivery information: ${tracking}`]
      : []),
    'Questions? Reply to this message or contact banditwristbandsng@gmail.com.',
  ].join('\n\n');
}
export function whatsappPhone(value: string): string | null {
  let digits = value.replace(/[\s()+-]/g, '');
  if (/^0\d{10}$/.test(digits)) digits = `234${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
