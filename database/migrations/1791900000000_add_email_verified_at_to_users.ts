import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('email_verified_at').nullable()
    })

    // Les comptes déjà créés (dont l'admin) sont considérés comme confirmés
    this.defer(async (db) => {
      await db.from(this.tableName).whereNull('email_verified_at').update({
        email_verified_at: new Date(),
      })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified_at')
    })
  }
}
