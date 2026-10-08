import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'offers'

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

      // Présentation de l'offre (le modèle de description est découpé en sections)
      table.string('title', 150).notNullable()
      table.string('contract_type', 20).notNullable() // cdi | cdd | internship | freelance | apprenticeship
      table.string('work_mode', 20).notNullable() // onsite | hybrid | remote
      table.string('location', 150).nullable()
      table.string('salary_range', 100).nullable()
      table.text('summary').notNullable() // à propos du poste
      table.text('missions').notNullable()
      table.text('profile').nullable() // profil recherché
      table.text('benefits').nullable() // avantages

      // Critères structurés : ce sont eux qui servent au scoring
      table.specificType('required_skills', 'text[]').notNullable().defaultTo('{}')
      table.specificType('nice_skills', 'text[]').notNullable().defaultTo('{}')
      table.smallint('min_experience_years').notNullable().defaultTo(0)
      table.string('education_level', 20).nullable() // niveau minimal souhaité
      table.specificType('languages', 'text[]').notNullable().defaultTo('{}')

      // Cycle de vie
      table.string('status', 20).notNullable().defaultTo('draft') // draft | published | closed
      table.timestamp('published_at').nullable()
      table.date('deadline').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id'], 'idx_offers_user')
      table.index(['status', 'published_at'], 'idx_offers_public_list')
    })

    this.schema.raw(
      'ALTER TABLE offers ADD CONSTRAINT offers_experience_check CHECK (min_experience_years BETWEEN 0 AND 40)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
