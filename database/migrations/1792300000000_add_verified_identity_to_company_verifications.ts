import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'company_verifications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Identité (nom + adresse) telle qu'elle a été approuvée
      table.string('verified_identity', 700).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('verified_identity')
    })
  }
}
