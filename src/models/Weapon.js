const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const _ = require('underscore');

let WeaponModel = {};

// mongoose.Types.ObjectID is a function that
// converts string ID to real mongo ID
const convertId = mongoose.Types.ObjectId;
const setName = name => _.escape(name).trim();
const setColor = color => _.escape(color).trim();

const WeaponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },

  color: {
    type: String,
    required: true,
    trim: true,
    set: setColor,
  },

  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },

  createdData: {
    type: Date,
    default: Date.now,
  },
});

WeaponSchema.statics.toAPI = doc => ({
  name: doc.name,
  color: doc.color,
});

WeaponSchema.statics.findByOwner = (ownerId, callback) => {
  const search = {
    owner: convertId(ownerId),
  };

  return WeaponModel.find(search).select('name color').exec(callback);
};

WeaponSchema.statics.delete = (data) => {
  console.log('deleting');


  WeaponModel.findOne({ name: data }, (err, model) => {
    if (err) {
      return;
    }
    model.remove();
  });
};


WeaponModel = mongoose.model('Weapon', WeaponSchema);

module.exports.WeaponModel = WeaponModel;
module.exports.WeaponSchema = WeaponSchema;
