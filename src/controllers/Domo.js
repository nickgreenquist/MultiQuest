const models = require('../models');

const Domo = models.Domo;
const Account =  models.Account;

const makerPage = (req, res) => {
    
    console.log(req.session.account.username);
    const accountInfo = {
      username: req.session.account.username,
      level: req.session.account.level,
      exp: req.session.account.exp,
      maxDistance: req.session.account.maxDistance,
      attack: req.session.account.attack,
      speed: req.session.account.speed,
      spellPower: req.session.account.spellPower,
    }

    return res.render('app', { info: accountInfo, csrfToken: req.csrfToken()});
};

const leaderPage = (req, res) => {
  
  const accountInfo = {
      username: req.session.account.username,
      level: req.session.account.level,
      exp: req.session.account.exp,
      maxDistance: req.session.account.maxDistance,
      attack: req.session.account.attack,
      speed: req.session.account.speed,
      spellPower: req.session.account.spellPower,
    }
  
   Account.AccountModel.find().sort({ maxDistance : -1 }).exec((err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    return res.render('leader', { info: accountInfo, csrfToken: req.csrfToken(), board: docs});
  });
};
const makeDomo = (req, res) => {
  if (!req.body.name || !req.body.age || !req.body.height) {
    return res.status(400).json({ error: 'RAWR! Name and age and height are required' });
  }

  const domoData = {
    name: req.body.name,
    age: req.body.age,
    height: req.body.height,
    owner: req.session.account._id,
  };

  const newDomo = new Domo.DomoModel(domoData);

  return newDomo.save((err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occured' });
    }

    return res.json({ redirect: '/maker' });
  });
};

const deleteDomo = (req, res) => {
  console.log('deleting');
  console.log(req.body.name);

  Domo.DomoModel.delete(req.body.name);

  return res.json({ redirect: '/maker' });
};

module.exports.makerPage = makerPage;
module.exports.leaderPage = leaderPage;
module.exports.make = makeDomo;
module.exports.delete = deleteDomo;
