const leaderboard = (req, res) => {
  console.log('displaying leaderboard');

  const accountInfo = {
    username: req.session.account.username,
    level: req.session.account.level,
    exp: req.session.account.exp,
    maxDistance: req.session.account.maxDistance,
    attack: req.session.account.attack,
    speed: req.session.account.speed,
    spellPower: req.session.account.spellPower,
  };

  res.render('leader', { info: accountInfo, csrfToken: req.csrfToken() });
};

module.exports.leaderboard = leaderboard;
