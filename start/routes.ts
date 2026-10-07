/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')

/*
|--------------------------------------------------------------------------
| Candidatures (pages publiques)
|--------------------------------------------------------------------------
*/
router.get('/postuler', [controllers.Application, 'create'])
router.post('/postuler', [controllers.Application, 'store'])
router.on('/merci').render('pages/applications/thanks').as('thanks')

/*
|--------------------------------------------------------------------------
| Connexion de l'équipe
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

/*
|--------------------------------------------------------------------------
| Espace équipe SKULLVI (connexion obligatoire)
| L'inscription est réservée aux admins déjà connectés.
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('/dashboard', [controllers.Dashboard, 'index']).as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
