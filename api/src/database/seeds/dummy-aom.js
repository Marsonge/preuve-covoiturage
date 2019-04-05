/* eslint-disable no-console */
const Aom = require('../../routes/aom/model');
const aomService = require('../../routes/aom/service');
const User = require('../../routes/users/model');
const userService = require('../../routes/users/service');

module.exports = async function dummyAom() {
  // search for dummy aom
  let aom = await Aom.findOne({ name: 'Dummy AOM' }).exec();

  // create the AOM
  if (!aom) {
    aom = await aomService.create({
      name: 'Dummy AOM',
      shortname: 'Dummy',
      insee_main: '01001',
      insee: ['01001', '01002', '01003', '01004'],
      company: {
        siren: '123456789',
        region: 'Lune',
        nature_juridique: 'Communauté d\'agglomération',
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[0, 0], [0, 1], [1, 1], [0, 0]]]],
      },
    });
  }

  const user = await User.findOne({ email: 'aom@example.com' }).exec();

  // check if a user is attached to this AOM
  if (!user) {
    await userService.create({
      email: 'aom@example.com',
      phone: '+33123456789',
      firstname: 'AOM',
      lastname: 'Example',
      password: 'aom1234',
      group: 'aom',
      role: 'user',
      status: 'invited',
      aom: aom._id,
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('- 💾 Create Dummy AOM with user aom@example.com');
  }
};