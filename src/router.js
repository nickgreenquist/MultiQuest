const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/game', mid.requiresSecure, controllers.Game.enterGame);
  app.post('/game', mid.requiresSecure, controllers.Game.save);
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.get('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signupPage);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/maker', mid.requiresLogin, controllers.Domo.makerPage);
  app.get('/leader', mid.requiresLogin, controllers.Domo.leaderPage);
  app.get('/lobby', mid.requiresLogin, controllers.Lobby.lobby);
  app.post('/enterGame', mid.requiresLogin, controllers.Lobby.enter);
  app.post('/maker', mid.requiresLogin, controllers.Weapon.make);
  app.post('/remove', mid.requiresLogin, controllers.Weapon.delete);
  app.post('/activate', mid.requiresLogin, controllers.Weapon.activate);
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
};

module.exports = router;
