import { Knex } from 'knex';

export interface IMigration {
  up(knex: Knex): Promise<void>;
  down(knex: Knex): Promise<void>;
}

export abstract class Migration implements IMigration {
  abstract up(knex: Knex): Promise<void>;
  abstract down(knex: Knex): Promise<void>;

  protected async createTableIfNotExists(
    knex: Knex,
    tableName: string,
    callback: (table: Knex.CreateTableBuilder) => void
  ): Promise<void> {
    const exists = await knex.schema.hasTable(tableName);
    if (!exists) {
      await knex.schema.createTable(tableName, callback);
    }
  }

  protected async dropTableIfExists(knex: Knex, tableName: string): Promise<void> {
    const exists = await knex.schema.hasTable(tableName);
    if (exists) {
      await knex.schema.dropTable(tableName);
    }
  }
}
