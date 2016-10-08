'use strict';

const {assert, expect} = require('chai');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

const app = require('../src/server-core');

const {testDb} = require('./test-config');

const testPort = 4000;

const db = mongoose.connection;
mongoose.connect(testDb);


describe('Authorization', () => {
  let server;
  before(done => {
    server = app.listen(testPort, done);

  });
  after(() => {
    db.db.dropCollection('users', function(err, result) {
      server.close();
    });
  });

  describe('Registration', () => {
    it ('Returns an error when user has params missing', done => {
      fetch(`http://localhost:${testPort}/api/register`, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        method: 'POST',
        body: 'email=test@test.com'
      })
        .then(response => {
          assert(response.status === 422);
          return response.json()
        })
        .then(body => {
          expect(body.message).to.exist;
          done();
        })
        .catch(done);
    });

    it ('Returns error when password and password confirmation don\'t match', done => {
      fetch(`http://localhost:${testPort}/api/register`, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        method: 'POST',
        body: JSON.stringify({email: 'test@test.com', password: 'password', confirmPassword: 'drowssap'})
      })
        .then(response => {
          assert(response.status === 422);
          return response.json();
        })
        .then(body => {
          expect(body.message).to.exist;
          done();
        })
        .catch(done);
    });

    it ('Returns token when data is valid', done => {
      fetch(`http://localhost:${testPort}/api/register`, {
        headers: {'Content-Type': 'application/json', 'User-Agent': 'Fetch'},
        method: 'POST',
        body: JSON.stringify({email: 'test@test.com', password: 'password', confirmPassword: 'password'})
      })
        .then(response => {
          assert(response.ok);
          return response.json()
        })
        .then(body => {
          expect(body.token).to.exist;
          done();
        })
        .catch(done);
    });

    it ('Returns an error when email is taken', done => {
      fetch(`http://localhost:${testPort}/api/register`, {
        headers: {'Content-Type': 'application/json', 'User-Agent': 'Fetch'},
        method: 'POST',
        body: JSON.stringify({email: 'taken@email.com', password: 'newpassword', confirmPassword: 'newpassword'})
      }).then(() => {
        return fetch(`http://localhost:${testPort}/api/register`, {
          headers: {'Content-Type': 'application/json', 'User-Agent': 'Fetch'},
          method: 'POST',
          body: JSON.stringify({email: 'taken@email.com', password: 'otherpassword', confirmPassword: 'otherpassword'})
        })
      })
        .then(response => {
          assert(response.status === 422);
          return response.json();
        })
        .then(body => {
          expect(body.message).to.exist;
          done();
        })
        .catch(done);
    });
  })

});
