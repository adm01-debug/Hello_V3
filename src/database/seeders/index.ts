import { Knex } from 'knex';
import { UsersSeeder } from './users.seeder';
import { ContactsSeeder } from './contacts.seeder';

export async function seed(knex: Knex): Promise<void> {
  await UsersSeeder.run(knex);
  await ContactsSeeder.run(knex);
}
