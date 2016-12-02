const server = require('../server.js');

const lobby = (req, res) => {
  console.log('Entering Lobby');

  // console.dir(server);
  const rooms = server.rooms;

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

  res.render('lobby', { info: accountInfo, rooms, csrfToken: req.csrfToken() });
};

const enterGame = (req, res) => {
  console.log('entering room');
  // console.log(req.body.name);
  console.dir(req.body);

  // Weapon.WeaponModel.delete(req.body.name);

  req.session.account.room = req.body.name;

  if (req.session.account.maxDistance < req.body.dis) {
    return res.status(401).json({ error: 'You are not strong enough for this room' });
  }

  return res.json({ redirect: '/game' });
};

module.exports.lobby = lobby;
module.exports.enter = enterGame;
