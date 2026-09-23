import { z } from 'zod';

const text = z.string().max(200);
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const orderRequestSchema = z.object({
  requestId: z.string().uuid(),
  expectedSubtotalMinor: z.number().int().nonnegative().optional(),
  items: z
    .array(
      z.object({
        id: text.min(1),
        material: text.min(1),
        color: hex,
        colorName: text.min(1),
        ink: hex,
        message: z.string().max(1000),
        subtitle: z.string().max(500),
        font: text,
        logo: z.literal(''),
        logos: z
          .array(
            z.object({
              id: text,
              name: text,
              artworkId: z.string().cuid(),
              x: z.number().min(0).max(100),
              y: z.number().min(0).max(100),
              size: z.number().min(5).max(100),
              aspect: z.number().positive().max(10000),
            })
          )
          .max(10)
          .optional(),
        quantity: z.number().int().min(1).max(100000),
        product: z
          .object({ id: text.min(1), slug: text.min(1), variantId: text.min(1) })
          .optional(),
      })
    )
    .min(1)
    .max(50),
});
export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type OrderLine = OrderRequest['items'][number] & {
  materialUnitMinor?: number;
  customizationUnitMinor?: number;
  name: string;
  requestedColor: boolean;
  unitMinor: number | null;
  totalMinor: number | null;
};
