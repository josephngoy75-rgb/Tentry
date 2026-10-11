import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'login_codes'

  async up() {
    this.schema.alterTable('users', (table) => {
      table.boolean('two_factor_enabled').notNullable().defaultTo(false)
    })

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // HMAC du code : le code lui-même n'est jamais stocké
      table.string('code_hash', 64).notNullable()
      table.smallint('attempts').notNullable().defaultTo(0)
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['user_id'], 'idx_login_codes_user')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.alterTable('users', (table) => {
      table.dropColumn('two_factor_enabled')
    })
  }
}
