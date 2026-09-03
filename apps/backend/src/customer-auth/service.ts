import type {
  CustomerAccountDto,
  CustomerLoginInput,
  CustomerRegistrationInput,
} from '@bandit/shared';
import { AppError } from '../errors/app-error.js';
import { hashPassword, verifyPassword } from './password.js';
import { customerAuthRepository } from './repository.js';
import {
  createSessionToken,
  hashSessionToken,
  SESSION_DURATION_MS,
} from './session.js';

const toDto = (customer: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): CustomerAccountDto => ({
  id: customer.id,
  email: customer.email,
  name: customer.name,
  createdAt: customer.createdAt.toISOString(),
});

async function issueSession(customerId: string): Promise<string> {
  const token = createSessionToken();
  await customerAuthRepository.createSession(
    customerId,
    hashSessionToken(token),
    new Date(Date.now() + SESSION_DURATION_MS),
  );
  return token;
}

export const customerAuthService = {
  async register(input: CustomerRegistrationInput) {
    const existing = await customerAuthRepository.findCustomerByEmail(input.email);
    if (existing) throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE');

    const customer = await customerAuthRepository.createCustomer({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
    return { customer: toDto(customer), token: await issueSession(customer.id) };
  },

  async login(input: CustomerLoginInput) {
    const customer = await customerAuthRepository.findCustomerByEmail(input.email);
    if (!customer || !(await verifyPassword(input.password, customer.passwordHash))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    return { customer: toDto(customer), token: await issueSession(customer.id) };
  },

  async currentCustomer(token: string | null): Promise<CustomerAccountDto> {
    if (!token) throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    const customer = await customerAuthRepository.findCustomerBySessionHash(hashSessionToken(token));
    if (!customer) throw new AppError('Session is invalid or expired', 401, 'INVALID_SESSION');
    return toDto(customer);
  },

  async logout(token: string | null): Promise<void> {
    if (token) await customerAuthRepository.deleteSession(hashSessionToken(token));
  },
};
