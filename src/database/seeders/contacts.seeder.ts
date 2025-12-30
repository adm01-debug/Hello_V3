import { Knex } from 'knex';

export class ContactsSeeder {
  public static async run(knex: Knex): Promise<void> {
    await knex('contacts').del();

    await knex('contacts').insert([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        created_at: new Date(),
      },
    ]);

    console.log('✅ Contacts seeded');
  }
}
