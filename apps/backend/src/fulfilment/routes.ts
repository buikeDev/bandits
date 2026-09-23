import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { prisma, type Prisma } from '@bandit/database';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { enforce, guestIdentity } from '../middleware/abuse.js';
import { currentStaff } from '../admin/auth.js';

export const enquirySchema = z.object({
 requestId: z.string().uuid(), name: z.string().trim().min(2).max(120), business: z.string().trim().min(2).max(160),
 email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), phone: z.string().trim().max(40).default(''),
 monthlyOrders: z.enum(['Just getting started', '1-100', '101-500', '501-2,000', '2,000+']),
 requirements: z.string().trim().min(10).max(3000), website: z.string().max(500).default(''),
});
const statuses = z.enum(['NEW', 'CONTACTED', 'IN_DISCUSSION', 'CLOSED']);
export const fulfilmentRepository = {
 find: (requestId: string) => prisma.fulfilmentEnquiry.findUnique({ where: { requestId } }),
 transaction: <T>(run: (tx: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(run),
};
export const fulfilmentRouter: ReturnType<typeof Router> = Router();
fulfilmentRouter.post('/enquiries', async (req, res, next) => {
 try {
  const { requestId, website, ...input } = enquirySchema.parse(req.body);
  if (website) throw new AppError('Unable to submit. Please contact us by email.', 400, 'INVALID_ENQUIRY');
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const previous = await fulfilmentRepository.find(requestId);
  if (previous) {
   if (previous.requestHash !== hash) throw new AppError('This submission changed. Please submit again.', 409, 'ENQUIRY_CHANGED');
   res.json({ success: true, data: { reference: previous.reference } }); return;
  }
  await enforce(res, 'enquiry_guest', guestIdentity(req, res), 5, 3600000);
  await enforce(res, 'enquiry_email', input.email, 3, 3600000);
  const saved = await fulfilmentRepository.transaction(async tx => {
   const row = await tx.fulfilmentEnquiry.upsert({ where: { requestId }, update: {}, create: { requestId, requestHash: hash, reference: `FUL-${randomUUID().toUpperCase()}`, ...input } });
   if (row.requestHash !== hash) throw new AppError('Submission changed', 409, 'ENQUIRY_CHANGED');
   const origin = process.env.ADMIN_DASHBOARD_URL || process.env.CUSTOMER_AUTH_ORIGIN || 'http://localhost:3000';
   const url = new URL(origin);
   if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new AppError('Enquiry service configuration unavailable', 503, 'CONFIGURATION');
   for (const audience of ['TEAM', 'CUSTOMER'] as const) {
    const recipient = audience === 'TEAM' ? 'banditwristbandsng@gmail.com' : row.email;
    const text = audience === 'TEAM'
     ? `New fulfilment enquiry ${row.reference}\nBusiness: ${row.business}\nContact: ${row.name}\nEmail: ${row.email}\nPhone: ${row.phone || 'Not provided'}\nMonthly orders: ${row.monthlyOrders}\nRequirements: ${row.requirements}\n\nStaff sign-in required: ${url.origin}/admin/fulfilment/${row.reference}`
     : `Thank you for contacting BAND-IT. Your fulfilment enquiry has been received.\nReference: ${row.reference}\nOur team will follow up with you.\nQuestions? Contact banditwristbandsng@gmail.com.`;
    await tx.orderNotification.upsert({ where: { eventKey: `fulfilment:${row.id}:${audience}` }, update: {}, create: { eventKey: `fulfilment:${row.id}:${audience}`, reference: row.reference, kind: `FULFILMENT_${audience}`, recipient, status: 'PENDING', payload: { from: process.env.ORDER_EMAIL_FROM || '', to: [recipient], reply_to: audience === 'TEAM' ? row.email : 'banditwristbandsng@gmail.com', subject: `BAND-IT fulfilment enquiry ${row.reference}`, text } } });
   }
   return row;
  });
  res.status(201).json({ success: true, data: { reference: saved.reference } });
 } catch (error) { next(error); }
});

export const fulfilmentAdmin: ReturnType<typeof Router> = Router();
fulfilmentAdmin.get('/', async (req, res, next) => {
 try {
  await currentStaff(req);
  const q = z.string().trim().max(100).default('').parse(req.query.q);
  const status = statuses.optional().parse(req.query.status);
  const page = z.coerce.number().int().min(1).max(10000).default(1).parse(req.query.page);
  const rows = await prisma.fulfilmentEnquiry.findMany({ where: { ...(status ? { status } : {}), OR: ['reference','business','email','name'].map(field => ({ [field]: { contains: q, mode: 'insensitive' } })) }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1)*20, take: 21, select: { reference: true, business: true, name: true, status: true, createdAt: true } });
  res.json({ success: true, data: { items: rows.slice(0,20), hasMore: rows.length > 20 } });
 } catch (error) { next(error); }
});
fulfilmentAdmin.get('/:reference', async (req, res, next) => {
 try {
  await currentStaff(req);
  const row = await prisma.fulfilmentEnquiry.findUnique({ where: { reference: req.params.reference } });
  if (!row) throw new AppError('Enquiry not found',404,'NOT_FOUND');
  const notifications = await prisma.orderNotification.findMany({ where: { reference: row.reference }, select: { id: true, kind: true, status: true, lastError: true }, orderBy: { createdAt: 'asc' } });
  const { requestId: _id, requestHash: _hash, ...enquiry } = row;
  res.json({ success: true, data: { ...enquiry, notifications } });
 } catch (error) { next(error); }
});
fulfilmentAdmin.post('/:reference', async (req, res, next) => {
 try {
  const staff = await currentStaff(req);
  const input = z.object({ version: z.number().int().min(0), status: statuses, note: z.string().trim().min(1).max(2000) }).parse(req.body);
  await prisma.$transaction(async tx => {
   const row = await tx.fulfilmentEnquiry.findUnique({ where: { reference: req.params.reference } });
   if (!row) throw new AppError('Enquiry not found',404,'NOT_FOUND');
   const history = row.history as Prisma.JsonArray;
   const changed = await tx.fulfilmentEnquiry.updateMany({ where: { id: row.id, version: input.version }, data: { status: input.status, version: { increment: 1 }, history: [...history, { staffId: staff.id, staffName: staff.name, note: input.note, from: row.status, to: input.status, at: new Date().toISOString() }] } });
   if (!changed.count) throw new AppError('Enquiry changed. Refresh before saving.',409,'CONFLICT');
  });
  res.json({ success: true, data: { ok: true } });
 } catch (error) { next(error); }
});
