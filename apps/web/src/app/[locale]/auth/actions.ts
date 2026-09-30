'use server';

import { hash } from '@node-rs/argon2';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import { prisma, Role, Locale } from '@dayak/db';
import { signIn, signOut } from '@/auth';

export async function logoutAction() {
  await signOut({ redirectTo: '/' });
}

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum([Role.PARENT, Role.NANNY]),
  locale: z.enum([Locale.hy, Locale.ru, Locale.en]),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{6,20}$/)
    .optional()
    .or(z.literal('')),
});

export type RegisterState = { error?: string } | undefined;

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    locale: formData.get('locale'),
    phone: formData.get('phone') ?? '',
  });

  if (!parsed.success) {
    return { error: 'invalid' };
  }
  const { name, email, password, role, locale, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'email_taken' };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      locale,
      phone: phone ? phone : undefined,
      passwordHash: await hash(password, ARGON),
    },
  });

  const dest = role === Role.NANNY ? `/${locale}/nanny` : `/${locale}/dashboard`;
  try {
    await signIn('credentials', { email, password, redirectTo: dest });
  } catch (err) {
    // signIn throws a redirect on success; re-throw it so Next handles the redirect.
    if (err instanceof AuthError) return { error: 'signin_failed' };
    throw err;
  }
  return undefined;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  locale: z.enum([Locale.hy, Locale.ru, Locale.en]),
});

export async function loginAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    locale: formData.get('locale'),
  });
  if (!parsed.success) return { error: 'invalid' };
  const { email, password, locale } = parsed.data;

  // Route to the right home by role.
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  const dest =
    user?.role === Role.ADMIN
      ? `/${locale}/admin`
      : user?.role === Role.NANNY
        ? `/${locale}/nanny`
        : `/${locale}/dashboard`;

  try {
    await signIn('credentials', { email, password, redirectTo: dest });
  } catch (err) {
    if (err instanceof AuthError) return { error: 'invalid_credentials' };
    throw err;
  }
  return undefined;
}
