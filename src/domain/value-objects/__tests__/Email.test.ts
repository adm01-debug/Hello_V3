import { describe, it, expect } from 'vitest';
import { Email } from '../Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw on invalid email', () => {
      expect(() => Email.create('invalid')).toThrow('Invalid email');
      expect(() => Email.create('invalid@')).toThrow('Invalid email');
      expect(() => Email.create('@example.com')).toThrow('Invalid email');
    });

    it('should throw on email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => Email.create(longEmail)).toThrow('Email too long');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
