import { describe, it, expect } from 'vitest';
import { User } from '../User';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid email', () => {
      const user = User.create('test@example.com', 'user');
      expect(user.getEmail()).toBe('test@example.com');
      expect(user.getRole()).toBe('user');
      expect(user.getId()).toBeDefined();
    });

    it('should throw error with invalid email', () => {
      expect(() => User.create('invalid-email', 'user')).toThrow();
    });

    it('should create admin user', () => {
      const user = User.create('admin@example.com', 'admin');
      expect(user.isAdmin()).toBe(true);
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote user to admin', () => {
      const user = User.create('test@example.com', 'user');
      user.promoteToAdmin();
      expect(user.isAdmin()).toBe(true);
      expect(user.getRole()).toBe('admin');
    });

    it('should throw error if already admin', () => {
      const user = User.create('test@example.com', 'admin');
      expect(() => user.promoteToAdmin()).toThrow('User is already an admin');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const user = User.create('test@example.com', 'user');
      const json = user.toJSON();
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('email', 'test@example.com');
      expect(json).toHaveProperty('role', 'user');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
