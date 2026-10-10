import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media_files'

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

      // Usage du fichier : logo, photo (puis photo de profil, justificatif...)
      table.string('kind', 30).notNullable()
      // Nom du fichier dans storage/uploads (généré, jamais fourni par l'utilisateur)
      table.string('path', 100).notNullable().unique()
      table.string('mime', 50).notNullable()
      table.integer('size').notNullable()

      table.timestamp('created_at').notNullable()

      table.index(['user_id', 'kind'], 'idx_media_files_owner')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
