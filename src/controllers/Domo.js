const models = require('../models');

const Account = models.Account;
const Weapon = models.Weapon;

const makerPage = (req, res) => {
  Weapon.WeaponModel.findByOwner(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
    const accountInfo = {
      username: req.session.account.username,
      level: req.session.account.level,
      exp: req.session.account.exp,
      points: req.session.account.points,
      maxDistance: req.session.account.maxDistance,
      attack: req.session.account.attack,
      speed: req.session.account.speed,
      spellPower: req.session.account.spellPower,
      maxHealth: req.session.account.maxHealth,
    };

    return res.render('app', { csrfToken: req.csrfToken(), weapons: docs, info: accountInfo });
  });
};

const leaderPage = (req, res) => {
  const accountInfo = {
    username: req.session.account.username,
    level: req.session.account.level,
    exp: req.session.account.exp,
    points: req.session.account.points,
    maxDistance: req.session.account.maxDistance,
    attack: req.session.account.attack,
    speed: req.session.account.speed,
    spellPower: req.session.account.spellPower,
    maxHealth: req.session.account.maxHealth,
  };

  Account.AccountModel.find().sort({ maxDistance: -1 }).exec((err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    return res.render('leader', { info: accountInfo, csrfToken: req.csrfToken(), board: docs });
  });
};


module.exports.makerPage = makerPage;
module.exports.leaderPage = leaderPage;
