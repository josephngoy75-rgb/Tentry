import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'applications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Identité et contact
      table.string('full_name', 150).notNullable()
      table.string('email', 254).notNullable().unique() // normalisé en minuscules
      table.string('phone', 30).nullable()
      table.string('country', 100).notNullable()
      table.string('city', 100).nullable()
      table.date('birth_date').nullable()

      // Profil
      table.string('education_level', 20).notNullable() // secondary | bachelor | master | doctorate | other
      table.string('program', 50).notNullable() // clé issue de config/programs.ts
      table.text('motivation').notNullable()
      table.smallint('experience_years').notNullable().defaultTo(0)
      table.text('experience_description').nullable()
      table.string('availability', 20).notNullable() // immediate | within_month | later
      table.string('portfolio_url', 500).nullable()

      // Calculé par le système
      table.smallint('score').notNullable().defaultTo(0)
      table.jsonb('score_breakdown').notNullable().defaultTo('{}')
      table.string('priority', 10).notNullable().defaultTo('low') // high | medium | low
      table.string('status', 20).notNullable().defaultTo('new') // new | reviewed | accepted | rejected

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      // Index pour le dashboard (liste classée + filtres)
      table.index(['program'], 'idx_applications_program')
      table.index(['priority'], 'idx_applications_priority')
      table.index(['status'], 'idx_applications_status')
    })

    // Contraintes de sécurité : une valeur aberrante ne peut jamais entrer
    this.schema.raw(
      'ALTER TABLE applications ADD CONSTRAINT applications_score_check CHECK (score BETWEEN 0 AND 100)'
    )
    this.schema.raw(
      'ALTER TABLE applications ADD CONSTRAINT applications_experience_check CHECK (experience_years BETWEEN 0 AND 40)'
    )

    // Index de classement : score décroissant, puis premier arrivé d'abord
    this.schema.raw(
      'CREATE INDEX idx_applications_ranking ON applications (score DESC, created_at ASC)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
