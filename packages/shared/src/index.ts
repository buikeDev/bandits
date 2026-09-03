import { z } from 'zod';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const customerRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export interface CustomerAccountDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  customer: CustomerAccountDto;
}
