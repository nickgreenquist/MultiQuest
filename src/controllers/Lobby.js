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
    playerType: req.session.account.playerType,
  };

  res.render('lobby', { info: accountInfo, rooms, csrfToken: req.csrfToken() });
};

const enterGame = (request, response) => {
  console.log('entering room');
  // console.log(req.body.name);
  console.dir(request.body);

  // Disable error for now, will figure out how to fix these later
  const req = request;
  req.session.account.room = req.body.name;

  if (req.session.account.maxDistance < req.body.dis) {
    return response.status(401).json({ error: 'You are not strong enough for this room' });
  }

  return response.json({ redirect: '/game' });
};

module.exports.lobby = lobby;
module.exports.enter = enterGame;
