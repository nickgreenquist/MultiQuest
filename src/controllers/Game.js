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
    maxHealth: req.session.account.maxHealth,
  };

  // res.render('game', { info: accountInfo, csrfToken: req.csrfToken() });
  res.render('game', { info: accountInfo });
};

const save = (req, res) => {
  console.log('saving character');

  const accountInfo = {
    username: req.session.account.username,
    level: req.session.account.level,
    exp: req.session.account.exp,
    maxDistance: req.session.account.maxDistance,
    attack: req.session.account.attack,
    speed: req.session.account.speed,
    spellPower: req.session.account.spellPower,
    maxHealth: req.session.account.maxHealth,
  };

  // res.render('game', { info: accountInfo, csrfToken: req.csrfToken() });
  res.render('game', { info: accountInfo });
};

module.exports.enterGame = enterGame;
module.exports.save = save;
