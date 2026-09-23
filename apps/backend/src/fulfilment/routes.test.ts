import assert from 'node:assert/strict';
import test from 'node:test';
import { enquirySchema } from './routes.js';

const valid = {
  requestId: 'f7e0438a-83f9-4cf7-818f-9e21cb2f1660',
  name: 'Ada Okafor',
  business: 'Example Events',
  email: 'ADA@EXAMPLE.COM',
  phone: '',
  monthlyOrders: '101-500',
  requirements: 'Store wristbands and deliver weekly across Lagos.',
  website: '',
};

test('fulfilment enquiry normalizes email and accepts supported order ranges', () => {
  const input = enquirySchema.parse(valid);
  assert.equal(input.email, 'ada@example.com');
  assert.equal(input.monthlyOrders, '101-500');
});

test('fulfilment enquiry requires a meaningful requirements brief', () => {
  assert.throws(() => enquirySchema.parse({ ...valid, requirements: 'Too short' }));
});
