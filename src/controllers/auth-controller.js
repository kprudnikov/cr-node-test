const User = require('../models/user');

module.exports = {
  login: login
}

function register (req, res) {

}

function login (req, res) {
  let users = User.findOne({name: 'test'}, function (user) {
    res.send(user);
  })
}