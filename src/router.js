'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const auth = require('./controllers/auth-controller');
const user = require('./controllers/user-controller');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.route('/register').post(auth.register);
router.route('/login').post(auth.login);
router.route('/me').get(user.getCurrentUser)
                   .put(user.editCurrentUser);


module.exports = router;