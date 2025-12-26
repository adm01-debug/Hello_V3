import { describe, it, expect } from 'vitest';
import { sql } from '../lib/db';

describe('Database Migration Tests', () => {
  describe('Schema Migrations', () => {
    it('should apply migrations in order', async () => {
      const migrations = await sql`
        SELECT version, name, applied_at
        FROM schema_migrations
        ORDER BY version ASC
      `;

      expect(migrations.length).toBeGreaterThan(0);
      
      for (let i = 1; i < migrations.length; i++) {
        expect(migrations[i].version).toBeGreaterThan(migrations[i-1].version);
      }
    });

    it('should have all required tables', async () => {
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;

      const tableNames = tables.map(t => t.table_name);
      
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('calls');
      expect(tableNames).toContain('contacts');
      expect(tableNames).toContain('transcriptions');
    });

    it('should rollback migration successfully', async () => {
      const version = '20250101000000';
      
      await sql`SELECT rollback_migration(${version}, 'test rollback')`;
      
      const migration = await sql`
        SELECT * FROM schema_migrations WHERE version = ${version}
      `;
      
      expect(migration.length).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      await expect(async () => {
        await sql`
          INSERT INTO calls (user_id, contact_id)
          VALUES ('invalid-user-id', 'invalid-contact-id')
        `;
      }).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      await sql`
        INSERT INTO users (email) VALUES ('test@example.com')
      `;

      await expect(async () => {
        await sql`
          INSERT INTO users (email) VALUES ('test@example.com')
        `;
      }).rejects.toThrow();
    });
  });
});
