const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const _ = require('underscore');

let WeaponModel = {};

// mongoose.Types.ObjectID is a function that
// converts string ID to real mongo ID
const convertId = mongoose.Types.ObjectId;
const setName = name => _.escape(name).trim();

const WeaponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },

  attack: {
    type: Number,
    min: 0,
    required: true,
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
  attack: doc.age,
});

WeaponSchema.statics.findByOwner = (ownerId, callback) => {
  const search = {
    owner: convertId(ownerId),
  };

  return WeaponModel.find(search).select('name attack').exec(callback);
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
