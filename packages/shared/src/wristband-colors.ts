import { z } from 'zod';

export const WRISTBAND_COLORS = [
  { name: 'Yellow', hex: '#ffc400' },
  { name: 'Blue', hex: '#0075ff' },
  { name: 'Indigo', hex: '#4b0082' },
  { name: 'Black', hex: '#101010' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Silver', hex: '#aaaaaa' },
  { name: 'Red', hex: '#ec1026' },
  { name: 'Green', hex: '#00c965' },
  { name: 'Pink', hex: '#ef51b4' },
  { name: 'Purple', hex: '#a94de4' },
  { name: 'Orange', hex: '#f37900' },
  { name: 'Multi-colour', hex: '#c4b5fd' },
] as const;

export function wristbandColor(value: string | null | undefined) {
  return WRISTBAND_COLORS.find((color) => color.name.toLowerCase() === value?.trim().toLowerCase());
}
export function wristbandColorHex(value: string | null | undefined) {
  return wristbandColor(value)?.hex ?? '#e5e5e5';
}
export const wristbandColorSchema = z
  .string()
  .trim()
  .max(80)
  .refine((value) => Boolean(wristbandColor(value)), 'Choose a supported wristband colour')
  .transform((value) => wristbandColor(value)!.name);
