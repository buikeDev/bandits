import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { prisma } from '@bandit/database';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { enforce, guestIdentity, privateKey } from '../middleware/abuse.js';
import { customerAuthService } from '../customer-auth/service.js';
import { readSessionToken } from '../customer-auth/session.js';

const encodedImage = z.string().max(3_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/);
const input = z.object({ name: z.string().trim().min(1).max(200), data: encodedImage });
const ids = z.object({ ids: z.array(z.string().cuid()).min(1).max(10) });
const bucket = () => process.env.ORDER_ARTWORK_BUCKET ?? 'order-artwork';

function storageConfig() {
  const origin = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const name = bucket();
  if (!origin || !key) throw new AppError('Artwork storage is not configured.', 503, 'STORAGE_UNAVAILABLE');
  const base = new URL(origin);
  if (base.protocol !== 'https:' || !base.hostname.endsWith('.supabase.co') || !/^[a-z0-9-]+$/.test(name))
    throw new AppError('Artwork storage configuration is invalid.', 503, 'STORAGE_UNAVAILABLE');
  return { base, key, name };
}
function validBytes(kind: string, bytes: Buffer) {
  return kind === 'png'
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : kind === 'jpeg'
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}
export async function artworkOwner(req: Request, res: Response) {
  const token = readSessionToken(req);
  const customer = token ? await customerAuthService.currentCustomer(token) : null;
  return customer ? privateKey(`customer:${customer.id}`) : privateKey(`guest:${guestIdentity(req, res)}`);
}
async function signed(storageKey: string) {
  const { base, key, name } = storageConfig();
  const response = await fetch(`${base.origin}/storage/v1/object/sign/${name}/${storageKey}`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 600 }), signal: AbortSignal.timeout(15000),
  });
  const result = (await response.json().catch(() => null)) as { signedURL?: string } | null;
  if (!response.ok || !result?.signedURL) throw new AppError('Artwork preview is temporarily unavailable.', 502, 'STORAGE_UNAVAILABLE');
  return `${base.origin}/storage/v1${result.signedURL}`;
}

export const artworkRouter = Router();
artworkRouter.post('/', async (req, res, next) => {
  try {
    const value = input.parse(req.body);
    const ownerHash = await artworkOwner(req, res);
    await enforce(res, 'artwork_upload', ownerHash, 20, 3600000);
    const match = /^data:image\/(png|jpeg|webp);base64,(.*)$/.exec(value.data)!;
    const bytes = Buffer.from(match[2], 'base64');
    if (!validBytes(match[1], bytes) || !bytes.length || bytes.length > 2 * 1024 * 1024)
      throw new AppError('Upload a valid PNG, JPEG or WebP image under 2 MB.', 400, 'INVALID_ARTWORK');
    const { base, key, name } = storageConfig();
    const storageKey = `${ownerHash.slice(0, 16)}/${randomUUID()}.${match[1]}`;
    const response = await fetch(`${base.origin}/storage/v1/object/${name}/${storageKey}`, {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': `image/${match[1]}`, 'x-upsert': 'false' }, body: bytes, signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new AppError('Artwork upload failed. Please try again.', 502, 'STORAGE_UNAVAILABLE');
    try {
      const asset = await prisma.artworkAsset.create({ data: { storageKey, ownerHash, originalName: value.name, contentType: `image/${match[1]}`, byteSize: bytes.length } });
      res.status(201).json({ success: true, data: { id: asset.id, name: asset.originalName, url: await signed(asset.storageKey) } });
    } catch (error) {
      void fetch(`${base.origin}/storage/v1/object/${name}/${storageKey}`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}`, apikey: key } });
      throw error;
    }
  } catch (error) { next(error); }
});
artworkRouter.post('/previews', async (req, res, next) => {
  try {
    const ownerHash = await artworkOwner(req, res); const value = ids.parse(req.body);
    const assets = await prisma.artworkAsset.findMany({ where: { id: { in: value.ids }, ownerHash } });
    if (assets.length !== value.ids.length) throw new AppError('Artwork is unavailable. Upload it again.', 409, 'ARTWORK_UNAVAILABLE');
    res.json({ success: true, data: await Promise.all(assets.map(async asset => ({ id: asset.id, name: asset.originalName, url: await signed(asset.storageKey) }))) });
  } catch (error) { next(error); }
});
export async function assertArtworkOwnership(ids: string[], ownerHash: string) {
  if (!ids.length) return;
  const count = await prisma.artworkAsset.count({ where: { id: { in: ids }, ownerHash } });
  if (count !== new Set(ids).size) throw new AppError('One or more artwork files are unavailable. Upload them again.', 409, 'ARTWORK_UNAVAILABLE');
}
export async function signedArtworkForStaff(id: string) {
  const asset = await prisma.artworkAsset.findUnique({ where: { id } });
  if (!asset) throw new AppError('Artwork not found', 404, 'NOT_FOUND');
  return { name: asset.originalName, url: await signed(asset.storageKey) };
}
