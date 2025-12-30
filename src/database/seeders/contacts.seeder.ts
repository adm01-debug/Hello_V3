import { Knex } from 'knex';
import * as crypto from 'crypto';

/**
 * Contact seed data interface
 */
interface ContactSeedData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position?: string;
  notes?: string;
  tags?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * ContactsSeeder - Production-ready contact seeding
 * 
 * Features:
 * - Realistic test data
 * - Phone validation
 * - Email validation
 * - Idempotent operation
 * - Transaction support
 * - Multiple contact types
 * 
 * @class ContactsSeeder
 */
export class ContactsSeeder {
  /**
   * Run the seeder
   * @public
   */
  public static async run(knex: Knex): Promise<void> {
    try {
      console.log('🌱 Starting contacts seeder...');

      await knex.transaction(async (trx) => {
        // Clear existing (development only)
        if (process.env.NODE_ENV === 'development') {
          await trx('contacts').del();
          console.log('  ↪ Existing contacts cleared');
        }

        // Generate contacts
        const contacts = this.generateContacts();

        for (const contact of contacts) {
          await this.insertOrUpdateContact(trx, contact);
        }

        console.log(`✅ Contacts seeded successfully (${contacts.length} contacts)`);
      });
    } catch (error) {
      console.error('❌ Contacts seeder failed:', error);
      throw error;
    }
  }

  /**
   * Generate seed contacts with realistic data
   * @private
   */
  private static generateContacts(): ContactSeedData[] {
    const now = new Date();

    return [
      {
        id: this.generateUUID(),
        name: 'John Doe',
        email: 'john.doe@acmeinc.com',
        phone: '+1-555-0123',
        company: 'Acme Inc',
        position: 'CEO',
        notes: 'Primary contact for enterprise deals',
        tags: 'vip,enterprise,decision-maker',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Jane Smith',
        email: 'jane.smith@techcorp.io',
        phone: '+1-555-0124',
        company: 'Tech Corp',
        position: 'CTO',
        notes: 'Technical decision maker, prefers email',
        tags: 'technical,enterprise,champion',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Robert Johnson',
        email: 'r.johnson@innovate.com',
        phone: '+1-555-0125',
        company: 'Innovate LLC',
        position: 'Product Manager',
        notes: 'Interested in API integration',
        tags: 'product,integration,warm-lead',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Maria Garcia',
        email: 'maria@startupxyz.com',
        phone: '+1-555-0126',
        company: 'Startup XYZ',
        position: 'Founder',
        notes: 'Early stage startup, budget conscious',
        tags: 'startup,founder,early-stage',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'David Chen',
        email: 'dchen@globalent.com',
        phone: '+1-555-0127',
        company: 'Global Enterprises',
        position: 'VP of Operations',
        notes: 'Looking for scalable solutions',
        tags: 'enterprise,operations,scalability',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Sarah Williams',
        email: 'swilliams@consultco.com',
        phone: '+1-555-0128',
        company: 'Consult Co',
        position: 'Senior Consultant',
        notes: 'Recommends our solution to clients',
        tags: 'partner,consultant,referrer',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Michael Brown',
        email: 'mbrown@oldschool.com',
        phone: '+1-555-0129',
        company: 'OldSchool Corp',
        position: 'IT Manager',
        notes: 'Legacy systems, needs migration support',
        tags: 'legacy,migration,support',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Emily Davis',
        email: 'emily@freelance.io',
        phone: '+1-555-0130',
        company: 'Freelance',
        position: 'Independent Developer',
        notes: 'Solo developer, interested in API',
        tags: 'developer,api,individual',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'James Wilson',
        email: 'jwilson@nonprofit.org',
        phone: '+1-555-0131',
        company: 'Nonprofit Org',
        position: 'Director',
        notes: 'Non-profit discount applied',
        tags: 'nonprofit,education,discount',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: this.generateUUID(),
        name: 'Lisa Anderson',
        email: 'lisa@inactive.com',
        phone: '+1-555-0132',
        company: 'Inactive Corp',
        position: 'Former Customer',
        notes: 'Churned last quarter, follow up in 6 months',
        tags: 'churned,follow-up,inactive',
        is_active: false,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        updated_at: now,
      },
    ];
  }

  /**
   * Insert or update contact (idempotent)
   * @private
   */
  private static async insertOrUpdateContact(
    trx: Knex.Transaction,
    contact: ContactSeedData
  ): Promise<void> {
    try {
      // Validate before insert
      this.validateContact(contact);

      // Check if exists
      const existing = await trx('contacts')
        .where({ email: contact.email })
        .first();

      if (existing) {
        // Update existing
        await trx('contacts')
          .where({ email: contact.email })
          .update({
            ...contact,
            id: existing.id, // Keep original ID
            updated_at: new Date(),
          });
        
        console.log(`  ↪ Updated contact: ${contact.name}`);
      } else {
        // Insert new
        await trx('contacts').insert(contact);
        console.log(`  ↪ Created contact: ${contact.name} (${contact.company})`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to seed contact ${contact.name}:`, error);
      throw error;
    }
  }

  /**
   * Validate contact data
   * @private
   */
  private static validateContact(contact: ContactSeedData): boolean {
    if (!contact.name || contact.name.length < 2) {
      throw new Error(`Invalid name: ${contact.name}`);
    }

    if (!contact.email || !contact.email.includes('@')) {
      throw new Error(`Invalid email: ${contact.email}`);
    }

    if (!contact.phone || !this.isValidPhone(contact.phone)) {
      throw new Error(`Invalid phone: ${contact.phone}`);
    }

    return true;
  }

  /**
   * Validate phone format (basic E.164 check)
   * @private
   */
  private static isValidPhone(phone: string): boolean {
    // Basic E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const cleaned = phone.replace(/[-\s().]/g, '');
    return phoneRegex.test(cleaned);
  }

  /**
   * Generate UUID v4
   * @private
   */
  private static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Clean up seeded contacts
   * @public
   */
  public static async cleanup(knex: Knex): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot cleanup contacts in production!');
    }

    const seedEmails = [
      'john.doe@acmeinc.com',
      'jane.smith@techcorp.io',
      'r.johnson@innovate.com',
      'maria@startupxyz.com',
      'dchen@globalent.com',
      'swilliams@consultco.com',
      'mbrown@oldschool.com',
      'emily@freelance.io',
      'jwilson@nonprofit.org',
      'lisa@inactive.com',
    ];

    await knex('contacts').whereIn('email', seedEmails).del();
    console.log('✅ Seed contacts cleaned up');
  }
}
