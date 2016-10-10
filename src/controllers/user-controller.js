'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const {findUser} = require('../models/user');

module.exports = {
  getCurrentUser,
  editCurrentUser
};

function getCurrentUser (req, res) {
  _getAndVerifyToken(req)
    .then(decoded => {
      return findUser(decoded._doc); // TODO there should probably be a better way
    })
    .then(user => {
      let response = {email: user.email, id: user._id};
      res.send(response);
    })
    .catch(error => {
      res.status(401).send(error);
    });
}

function editCurrentUser (req, res) {
  _getAndVerifyToken(req)
    .then(decoded => {
      return findUser(decoded._doc);
    })
    .then(user => {
      let response;
      if (req.body.new_password) { // TODO add some validation here
        if (user.password === req.body.current_password) {
          user.password = req.body.new_password;
        } else {
          res.status(401).send({message: 'Wrong password'});
        }
      }

      user.email = req.body.email ? req.body.email : user.email;
      user.save((error, updatedUser) => {
        if (error) {
          res.status(500).send({message: 'Couldn\'t update user'});
        } else {
          response = {
            id: updatedUser._id,
            email: updatedUser.email
          };
          res.send(response);
        }
      })
    })
    .catch(error => {
      res.status(401).send(error);
    });
}

//private

function _getAndVerifyToken (request) {
  let token = request.body.token || request.query.token || request.headers['authorization'];  // should we maybe specify authorization type?

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