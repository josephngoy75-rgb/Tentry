import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'company_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Présentation
      table.text('description').nullable()
      table.string('sector', 20).nullable()
      table.string('size', 20).nullable()
      table.smallint('founded_year').nullable()

      // Adresse écrite (les coordonnées de la carte viennent à l'étape 1c)
      table.string('address_line', 200).nullable()
      table.string('city', 100).nullable()
      table.string('country', 100).nullable()

      // Liens publics
      table.string('website_url', 300).nullable()
      table.string('linkedin_url', 300).nullable()
      table.string('facebook_url', 300).nullable()
      table.string('instagram_url', 300).nullable()
      table.string('x_url', 300).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
