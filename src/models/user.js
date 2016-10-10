var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const User = mongoose.model('User', new Schema({
  email: String,
  password: String,
  admin: Boolean
}));

const permittedParams = ['email', 'password', 'admin', 'confirmPassword']; // there's probably middleware for this

function findUser (params) {
  return new Promise((resolve, reject) => {
    User.findOne(params, (error, user) => { // bluebird has promisify, but let's do it hard way
      if (error) {
        reject({message: 'Couldn\'t find user'});
      } else {
        resolve(user);
      }
    });
  });
}

function createUser (params) {
  return new Promise((resolve, reject) => {
    new User(params) // must not save passwords as plain text
      .save((error, user) => {
        if (error) {
          reject(500).send({message: 'Something went wrong'});
        } else {
          resolve(user);
        }
      });
  });
}

module.exports = {
  User,
  permittedParams,
  findUser,
  createUser
};