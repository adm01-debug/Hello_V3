import { Knex } from 'knex';

/**
 * Initial database schema migration
 * 
 * Creates:
 * - users table
 * - contacts table
 * - calls table
 * - All necessary indexes
 * - Foreign key constraints
 * 
 * @param {Knex} knex
 */
export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension (PostgreSQL)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Users table
  await knex.schema.createTable('users', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Authentication
    table.string('email', 254).notNullable().unique();
    table.string('password_hash', 255).notNullable();

    // Profile
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.enum('role', ['user', 'admin', 'moderator']).notNullable().defaultTo('user');

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.timestamp('email_verified_at');

    // Metadata
    table.timestamp('last_login_at');
    table.string('last_login_ip', 45);
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.timestamp('locked_until');

    // Timestamps
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    // Indexes
    table.index('email');
    table.index('role');
    table.index(['is_active', 'email_verified']);
    table.index('created_at');
  });

  // Contacts table
  await knex.schema.createTable('contacts', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Basic info
    table.string('name', 200).notNullable();
    table.string('email', 254).notNullable();
    table.string('phone', 20);
    table.string('company', 200);
    table.string('position', 100);

    // Additional
    table.text('notes');
    table.text('tags'); // Comma-separated
    table.string('avatar_url', 500);

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);

    // Ownership
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');

    // Timestamps
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    // Indexes
    table.index('email');
    table.index('company');
    table.index('created_by');
    table.index(['is_active', 'email']);
  });

  // Calls table
  await knex.schema.createTable('calls', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Relations
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('contact_id').references('id').inTable('contacts').onDelete('SET NULL');

    // Call details
    table.enum('direction', ['inbound', 'outbound']).notNullable();
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'failed']).notNullable();
    table.string('phone_number', 20);
    table.integer('duration_seconds');
    table.decimal('cost', 10, 2);

    // Content
    table.text('notes');
    table.text('summary');
    table.text('transcript');
    table.json('metadata'); // Additional flexible data

    // Analysis
    table.enum('sentiment', ['positive', 'neutral', 'negative']);
    table.integer('quality_score'); // 1-10
    table.text('tags'); // Comma-separated

    // Scheduling
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('ended_at');

    // Timestamps
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    // Indexes
    table.index('user_id');
    table.index('contact_id');
    table.index('status');
    table.index('direction');
    table.index('scheduled_at');
    table.index('started_at');
    table.index(['user_id', 'status']);
    table.index(['contact_id', 'status']);
  });

  // Audit log table
  await knex.schema.createTable('audit_logs', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Event details
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').notNullable();
    table.string('action', 50).notNullable(); // create, update, delete
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');

    // Changes
    table.json('old_values');
    table.json('new_values');

    // Metadata
    table.string('ip_address', 45);
    table.string('user_agent', 500);

    // Timestamp
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['entity_type', 'entity_id']);
    table.index('user_id');
    table.index('created_at');
  });

  // Create updated_at trigger function (PostgreSQL)
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Apply trigger to tables
  const tables = ['users', 'contacts', 'calls'];
  for (const tableName of tables) {
    await knex.raw(`
      CREATE TRIGGER update_${tableName}_updated_at
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  }
}

/**
 * Rollback migration
 * @param {Knex} knex
 */
export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  const tables = ['users', 'contacts', 'calls'];
  for (const tableName of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName}`);
  }

  // Drop trigger function
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');

  // Drop tables (reverse order due to foreign keys)
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('calls');
  await knex.schema.dropTableIfExists('contacts');
  await knex.schema.dropTableIfExists('users');

  // Drop extension
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}
