const {User, permittedParams} = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = {
  register: register,
  login: login,
  getCurrentUser: getCurrentUser
};

function register (req, res) {
  return _findUser({email: req.body.email})
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
    .then(_createUser)
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

  return _findUser({email: params.email})
    .then((user) => {
      if (user && _isUserValid(user, params)) {
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

function getCurrentUser (req, res) {
  _getAndVerifyToken(req)
    .then(decoded => {
      return _findUser(decoded._doc); // TODO there should probably be a better way
    })
    .then(user => {
      let response = {email: user.email, id: user._id};
      res.send(response);
    })
    .catch(error => {
      res.status(403).send(error);
    });
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

function _findUser (params) {
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

function _createUser (params) {
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

function _isUserValid (user, params) {
  return user.email === params.email && user.password === params.password;
}

function _isRegistrationValid (params) {
  return params.email && params.password && params.confirmPassword && params.password === params.confirmPassword;
}

function _getAndVerifyToken (request) {
  let token = request.body.token || request.query.token || request.headers['x-access-token'];

  return new Promise((resolve, reject) => {
    jwt.verify(token, config.key, function(err, decoded) {
      if (err) {
        reject({message: 'Failed to authenticate token.' });
      } else {
        resolve(decoded);
      }
    });
  });

}