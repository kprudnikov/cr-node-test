'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const auth = require('./controllers/auth-controller');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.route('/register').post(auth.register);
router.route('/login').post(auth.login);
router.route('/me').get(auth.getCurrentUser)
                   .put(auth.editCurrentUser);


module.exports = router;