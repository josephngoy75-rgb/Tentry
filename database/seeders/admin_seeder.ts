import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const email = (process.env.ADMIN_EMAIL ?? 'admin@skullvi.org').toLowerCase()
    const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe2026!'

    // updateOrCreate : relancer le seeder ne crée pas de doublon
    await User.updateOrCreate({ email }, { fullName: 'Administrateur', password, role: 'admin' })
  }
}
