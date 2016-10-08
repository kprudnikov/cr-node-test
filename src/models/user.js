var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.User = mongoose.model('User', new Schema({
  email: String,
  password: String,
  admin: Boolean
}));

module.exports.permittedParams = ['email', 'password', 'admin', 'confirmPassword']; // there's probably middleware for this