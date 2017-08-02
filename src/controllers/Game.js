const enterGame = (req, res) => {
  console.log('enter into game');
  // console.log(req.session.account);

  let color = 'none';
  if (typeof req.session.account.color !== 'undefined') {
    color = req.session.account.color;
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
    room: req.session.account.room,
    playerType: req.session.account.playerType,
    weaponType: req.session.account.weaponType,
    color,
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
    points: req.session.account.points,
    maxDistance: req.session.account.maxDistance,
    attack: req.session.account.attack,
    speed: req.session.account.speed,
    spellPower: req.session.account.spellPower,
    maxHealth: req.session.account.maxHealth,
    playerType: req.session.account.playerType,
    weaponType: req.session.account.weaponType,
  };

  // res.render('game', { info: accountInfo, csrfToken: req.csrfToken() });
  res.render('game', { info: accountInfo });
};

module.exports.enterGame = enterGame;
module.exports.save = save;
