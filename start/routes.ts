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
| Candidatures (pages publiques, ancien parcours : remplacé par les offres)
|--------------------------------------------------------------------------
*/
router.get('/postuler', [controllers.Application, 'create'])
router.post('/postuler', [controllers.Application, 'store'])
router.on('/merci').render('pages/applications/thanks').as('thanks')

/*
|--------------------------------------------------------------------------
| Inscription et connexion (visiteurs non connectés)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

/*
|--------------------------------------------------------------------------
| Utilisateurs connectés (tous les rôles)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/mon-espace', [controllers.Account, 'index']).as('account')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

/*
|--------------------------------------------------------------------------
| Administration de la plateforme (rôle admin uniquement)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/dashboard', [controllers.Dashboard, 'index']).as('dashboard')
    router.get('/dashboard/:id', [controllers.Dashboard, 'show'])
    router.post('/dashboard/:id/status', [controllers.Dashboard, 'updateStatus'])
  })
  .use([middleware.auth(), middleware.role({ roles: ['admin'] })])