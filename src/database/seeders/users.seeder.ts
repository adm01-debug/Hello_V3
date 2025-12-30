import { Knex } from 'knex';

export class UsersSeeder {
  public static async run(knex: Knex): Promise<void> {
    await knex('users').del();

    await knex('users').insert([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@hello.app',
        role: 'admin',
        created_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@hello.app',
        role: 'user',
        created_at: new Date(),
      },
    ]);

    console.log('✅ Users seeded (2 users)');
  }
}
