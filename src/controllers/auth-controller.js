'use strict';

const {permittedParams, findUser, createUser} = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = {
  register,
  login
};

function register (req, res) {
  return findUser({email: req.body.email})
    .then(user => {
      if (user) {
        return Promise.reject({message: 'This email is already taken'});
      }

      let params = _filterParams(req.body);
      if (_isRegistrationValid(params)) {
        return params;
      } else {
        return Promise.reject({message: 'Params invalid'});
      }
    })
    .then(createUser)
    .then(_generateToken)
    .then(token => {
      res.send({token: token});
    })
    .catch(error => {
      res.status(422).send(error);
    });
}

function login (req, res) {
  let params = _filterParams(req.body);

  return findUser({email: params.email})
    .then((user) => {
      if (user && _isParamsValid(user, params)) {
        let token = _generateToken(user);
        res.send({token});
      } else {
        return Promise.reject({message: 'Please check your username and password'})
      }
    })
    .catch(error => {
      res.status(422).send(error);
    })
}

// private

// TODO probably move some of these functions to model
function _filterParams (body) {
  let params = {};
  permittedParams.forEach(param => {
    if (body[param]) {
      params[param] = body[param];
    }
  });

  return params;
}

function _generateToken (user) {
  return jwt.sign(user, config.key, {
    expiresIn: config.tokenExp
  });
}

function _isParamsValid (user, params) {
  return user.email === params.email && user.password === params.password;
}

function _isRegistrationValid (params) {
  return params.email && params.password && params.confirmPassword && params.password === params.confirmPassword;
  // also add validation
}
