const models = require('../models');

const Account = models.Account;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

const signupPage = (req, res) => {
  res.render('signup', { csrfToken: req.csrfToken() });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (request, response) => {
  console.log("logging in");
  const req = request;
  const res = response;

  // force cast to strings to cover some security flaws
  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return res.status(400).json({ error: 'RAWR! All fields are required!' });
  }

  return Account.AccountModel.authenticate(username, password, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password' });
    }

    req.session.account = Account.AccountModel.toAPI(account);

    return res.json({ redirect: '/maker' });
  });
};

const save = (request, response) => {
  const req = request;
  const res = response;
  console.dir(req.body);

  req.session.account.level = req.body.level;
  req.session.account.maxHealth = req.body.maxHealth;
  req.session.account.attack = req.body.attack;
  req.session.account.speed = req.body.speed;
  req.session.account.exp = req.body.exp;
  req.session.account.points = req.body.points;
  req.session.account.maxDistance = req.body.maxDistance;
  req.session.account.spellPower = req.body.spellPower;
  req.session.account.playerType = req.body.playerType;
  req.session.account.weaponType = req.body.weaponType;

  return res.json({ redirect: '/maker' });
};

const signup = (request, response) => {
  const req = request;
  const res = response;

  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'RAWR! All fields are reuired' });
  }

  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'RAWR! Passwords do not match' });
  }

  return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
    const accountData = {
      username: req.body.username,
      salt,
      password: hash,
      level: 1,
      maxHealth: 5,
      attack: 1,
      speed: 1,
      exp: 0,
      points: 0,
      maxDistance: 0,
      spellPower: 1,
      playerType: 0,
      weaponType: 0,
    };

    const newAccount = new Account.AccountModel(accountData);

    newAccount.save((err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occured' });
      }
      req.session.account = Account.AccountModel.toAPI(newAccount);

      return res.json({ redirect: '/maker' });
    });
  });
};

module.exports.loginPage = loginPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signupPage = signupPage;
module.exports.signup = signup;
module.exports.save = save;
