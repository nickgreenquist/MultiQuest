const models = require('../models');

const Domo = models.Domo;
const Account =  models.Account;
const Weapon = models.Weapon;

const makeWeapon = (req, res) => {
  if (!req.body.name || !req.body.attack) {
    return res.status(400).json({ error: 'RAWR! Name and attack are required' });
  }

  const weaponData = {
    name: req.body.name,
    attack: req.body.attack,
    owner: req.session.account._id,
  };

  const newWeapon = new Weapon.WeaponModel(weaponData);

  return newWeapon.save((err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occured' });
    }

    return res.json({ redirect: '/maker' });
  });
};

const deleteWeapon = (req, res) => {
  console.log('deleting');
  console.log(req.body.name);

  Weapon.WeaponModel.delete(req.body.name);

  return res.json({ redirect: '/maker' });
};

module.exports.make = makeWeapon;
module.exports.delete = deleteWeapon;
