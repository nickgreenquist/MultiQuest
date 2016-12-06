const models = require('../models');

const Weapon = models.Weapon;

const makeWeapon = (req, res) => {
  if (!req.body.name || !req.body.color) {
    return res.status(400).json({ error: 'RAWR! Name and color are required' });
  }

  const weaponData = {
    name: req.body.name,
    color: req.body.color,
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

const activateWeapon = (request, response) => {
  console.log('activated');
  console.log(request.body.color);
  
  const req = request;
  //add the color to the req.session so the game can know what color to draw the sword
  req.session.account.color = request.body.color;

  return response.json({ redirect: '/maker' });
};

module.exports.make = makeWeapon;
module.exports.delete = deleteWeapon;
module.exports.activate = activateWeapon;
