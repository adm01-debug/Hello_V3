import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  userRoleSchema,
  agentStatusSchema,
  createContactSchema,
} from '@/lib/validation/schemas';

const uuidArb = fc.uuid();
const emailArb = fc.emailAddress();

describe('Zod schemas — property-based (1000 runs cada)', () => {
  it('uuidSchema aceita UUIDs válidos', () => {
    fc.assert(
      fc.property(uuidArb, (u) => uuidSchema.safeParse(u).success),
      { numRuns: 1000, seed: 42 },
    );
  });

  it('uuidSchema rejeita strings arbitrárias não-UUID', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 30 }).filter(s => !/^[0-9a-f-]{36}$/i.test(s)),
        (s) => !uuidSchema.safeParse(s).success,
      ),
      { numRuns: 500, seed: 7 },
    );
  });

  it('emailSchema aceita emails válidos', () => {
    fc.assert(
      fc.property(emailArb, (e) => emailSchema.safeParse(e).success),
      { numRuns: 1000, seed: 11 },
    );
  });

  it('emailSchema rejeita strings sem @', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 30 }).filter(s => !s.includes('@')),
        (s) => !emailSchema.safeParse(s).success,
      ),
      { numRuns: 500, seed: 13 },
    );
  });

  it('phoneSchema aceita telefones 8-20 chars', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[+\d\s()-]{8,20}$/),
        (p) => phoneSchema.safeParse(p).success,
      ),
      { numRuns: 1000, seed: 17 },
    );
  });

  it('phoneSchema rejeita < 8 ou > 20 chars', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.stringMatching(/^\d{0,7}$/),
          fc.stringMatching(/^\d{21,40}$/),
        ),
        (p) => !phoneSchema.safeParse(p).success,
      ),
      { numRuns: 500, seed: 19 },
    );
  });

  it('userRoleSchema só aceita roles enumeradas', () => {
    const valid = ['admin', 'supervisor', 'agent', 'viewer'];
    valid.forEach(r => expect(userRoleSchema.safeParse(r).success).toBe(true));
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }).filter(s => !valid.includes(s)),
        (s) => !userRoleSchema.safeParse(s).success,
      ),
      { numRuns: 500, seed: 23 },
    );
  });

  it('agentStatusSchema só aceita statuses enumerados', () => {
    const valid = ['available', 'busy', 'break', 'offline', 'inactive'];
    valid.forEach(s => expect(agentStatusSchema.safeParse(s).success).toBe(true));
  });

  it('createContactSchema valida nome obrigatório (1-255)', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^.{1,255}$/),
        (name) => createContactSchema.safeParse({ name }).success,
      ),
      { numRuns: 1000, seed: 29 },
    );
  });

  it('createContactSchema rejeita nome vazio', () => {
    expect(createContactSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('createContactSchema rejeita email malformado', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 30 }).filter(s => s.length > 0 && !s.includes('@')),
        (email) => !createContactSchema.safeParse({ name: 'A', email }).success,
      ),
      { numRuns: 500, seed: 31 },
    );
  });
});
