import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // password_reset | email_verification
      table.string('type', 30).notNullable()
      // Hachage SHA-256 du jeton : le jeton lui-même n'est jamais stocké
      table.string('token_hash', 64).notNullable().unique()

      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['user_id', 'type'], 'idx_auth_tokens_user_type')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
