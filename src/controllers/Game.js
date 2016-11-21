const models = require('../models');

const Domo = models.Domo;

const enterGame = (req, res) => {
  console.log('enter into game');

  const accountInfo = {
      username: req.session.account.username,
      level: req.session.account.level,
      exp: req.session.account.exp,
      maxDistance: req.session.account.maxDistance,
      attack: req.session.account.attack,
      speed: req.session.account.speed,
      spellPower: req.session.account.spellPower,
    }
  
  res.render('game', { info: accountInfo, csrfToken: req.csrfToken() });
  //res.render('game');
};

module.exports.enterGame = enterGame;
