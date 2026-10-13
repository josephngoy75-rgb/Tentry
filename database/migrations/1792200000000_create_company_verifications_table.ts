import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'company_verifications'

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

      // pending | verified | rejected (l'absence de ligne signifie "non vérifiée")
      table.string('status', 20).notNullable().defaultTo('pending')
      table.string('registration_number', 50).notNullable()
      table.timestamp('submitted_at').notNullable()

      table.timestamp('reviewed_at').nullable()
      table
        .integer('reviewed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.text('rejection_reason').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status', 'submitted_at'], 'idx_company_verifications_queue')
    })

    this.schema.raw(
      "ALTER TABLE company_verifications ADD CONSTRAINT company_verifications_status_check CHECK (status IN ('pending', 'verified', 'rejected'))"
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
