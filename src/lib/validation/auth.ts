/**
 * Schemas Zod para fluxos de autenticação (login, reset, recuperação).
 * Centraliza definições que antes ficavam inline em páginas, com mensagens PT-BR.
 */
import { z } from 'zod';

export const loginEmailSchema = z.string().email('Email inválido').max(255, 'Email muito longo');

/** Regras fortes de senha usadas em cadastro e redefinição. */
export const passwordFieldSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

export const resetPasswordSchema = z
  .object({
    password: passwordFieldSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;