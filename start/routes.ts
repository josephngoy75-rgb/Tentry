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
| Offres d'emploi, entreprises et images (pages publiques)
|--------------------------------------------------------------------------
*/
router.get('/offres', [controllers.PublicOffers, 'index']).as('offers.index')
router.get('/offres/:id', [controllers.PublicOffers, 'show']).as('offers.show')
router.get('/entreprises/:id', [controllers.PublicCompanies, 'show']).as('companies.show')
router.get('/medias/:id', [controllers.PublicMedia, 'show']).as('media.show')

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
| Mot de passe oublié (ouvert à tous)
|--------------------------------------------------------------------------
*/
router.get('/mot-de-passe-oublie', [controllers.PasswordReset, 'forgotForm'])
router.post('/mot-de-passe-oublie', [controllers.PasswordReset, 'forgotStore'])
router.on('/mot-de-passe-oublie/envoye').render('pages/auth/forgot_password_sent')
router.get('/reinitialiser-mot-de-passe/:token', [controllers.PasswordReset, 'resetForm'])
router.post('/reinitialiser-mot-de-passe/:token', [controllers.PasswordReset, 'resetStore'])
router.on('/mot-de-passe-modifie').render('pages/auth/password_changed')

/*
|--------------------------------------------------------------------------
| Confirmation de l'adresse email (le lien doit marcher sans être connecté)
|--------------------------------------------------------------------------
*/
router.get('/confirmer-email/:token', [controllers.EmailVerification, 'show'])
router.post('/confirmer-email/:token', [controllers.EmailVerification, 'confirm'])
router.on('/email-confirme').render('pages/auth/email_confirmed')

/*
|--------------------------------------------------------------------------
| Inscription, connexion et code de connexion (visiteurs non connectés)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])

    router.get('connexion/code', [controllers.TwoFactor, 'form'])
    router.post('connexion/code', [controllers.TwoFactor, 'verify'])
    router.post('connexion/code/renvoyer', [controllers.TwoFactor, 'resend'])
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
    router.post('/renvoyer-confirmation', [controllers.EmailVerification, 'resend'])

    router.get('/securite', [controllers.AccountSecurity, 'show']).as('account.security')
    router.post('/securite/2fa/activer', [controllers.AccountSecurity, 'enable'])
    router.post('/securite/2fa/desactiver', [controllers.AccountSecurity, 'disable'])
  })
  .use(middleware.auth())

/*
|--------------------------------------------------------------------------
| Espace entreprise (rôle company uniquement)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/entreprise/offres', [controllers.CompanyOffers, 'index']).as('company.offers.index')
    router
      .get('/entreprise/offres/nouvelle', [controllers.CompanyOffers, 'create'])
      .as('company.offers.create')
    router.post('/entreprise/offres', [controllers.CompanyOffers, 'store']).as('company.offers.store')
    router
      .get('/entreprise/offres/:id/modifier', [controllers.CompanyOffers, 'edit'])
      .as('company.offers.edit')
    router.post('/entreprise/offres/:id', [controllers.CompanyOffers, 'update'])
    router.post('/entreprise/offres/:id/statut', [controllers.CompanyOffers, 'updateStatus'])
    router.post('/entreprise/offres/:id/dupliquer', [controllers.CompanyOffers, 'duplicate'])

    router.get('/entreprise/profil', [controllers.CompanyProfile, 'edit']).as('company.profile.edit')
    router.post('/entreprise/profil', [controllers.CompanyProfile, 'update'])

    router
      .get('/entreprise/profil/medias', [controllers.CompanyMedia, 'edit'])
      .as('company.media.edit')
    router.post('/entreprise/profil/logo', [controllers.CompanyMedia, 'uploadLogo'])
    router.post('/entreprise/profil/photos', [controllers.CompanyMedia, 'uploadPhotos'])
    router.post('/entreprise/profil/medias/:id/supprimer', [controllers.CompanyMedia, 'destroy'])

    router
      .get('/entreprise/verification', [controllers.CompanyVerification, 'show'])
      .as('company.verification.show')
    router.post('/entreprise/verification', [controllers.CompanyVerification, 'submit'])
    router.get('/entreprise/verification/documents/:id', [controllers.CompanyVerification, 'document'])
  })
  .use([middleware.auth(), middleware.role({ roles: ['company'] })])

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

    router
      .get('/admin/verifications', [controllers.AdminVerifications, 'index'])
      .as('admin.verifications.index')
    router.get('/admin/verifications/:id', [controllers.AdminVerifications, 'show'])
    router.post('/admin/verifications/:id/approuver', [controllers.AdminVerifications, 'approve'])
    router.post('/admin/verifications/:id/refuser', [controllers.AdminVerifications, 'reject'])
    router.get('/admin/documents/:id', [controllers.AdminVerifications, 'document'])
  })
  .use([middleware.auth(), middleware.role({ roles: ['admin'] })])
