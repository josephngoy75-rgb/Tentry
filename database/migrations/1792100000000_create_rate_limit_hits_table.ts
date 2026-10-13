import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rate_limit_hits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // HMAC de "type:clé" (email, adresse IP...) : aucune donnée personnelle en clair
      table.string('bucket', 64).notNullable()
      table.timestamp('created_at').notNullable()

      table.index(['bucket', 'created_at'], 'idx_rate_limit_hits_bucket')
      table.index(['created_at'], 'idx_rate_limit_hits_created')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
