'use strict';

const {assert, expect} = require('chai');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

const app = require('../src/server-core');
const {testDb, testPort, rootPath} = require('./test-config');
// const {dropUsers} = require('../src/models/user');

const db = mongoose.connection;
const fetchOptions = {
  headers: {'Content-Type': 'application/json', 'User-Agent': 'Fetch'},
  method: 'POST',
};

describe('Authorization', () => {
  init();

  describe('Registration', () => {
    it ('returns an error when user has params missing', done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'test@test.com'});

      fetch(`${rootPath}/register`, options)
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

    it ('returns error when password and password confirmation don\'t match', done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'test@test.com', password: 'password', confirmPassword: 'drowssap'})

      fetch(`${rootPath}/register`, options)
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

    it ('returns token when data is valid', done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'test@test.com', password: 'password', confirmPassword: 'password'});

      fetch(`${rootPath}/register`, options)
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

    it ('returns an error when email is taken', done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'taken@email.com', password: 'newpassword', confirmPassword: 'newpassword'})

      fetch(`${rootPath}/register`, options)
        .then(() => {
          return fetch(`${rootPath}/register`, {
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
  });

  describe('Login', () => {
    it ('returns an error if user doesn\'t exist', done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'nonexistent@email.com', password: 'nonexistent'});

      fetch(`${rootPath}/login`, options)
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

    it ('returns an error if existing user tries to login without password', done => {
      let options = Object.create(fetchOptions);
      let body = {email: 'userwithoutpassword@email.com', password: 'nopassword', confirmPassword: 'nopassword'};
      options.body = JSON.stringify(body);

      fetch(`${rootPath}/register`, options)
        .then(() => {
          options.body = JSON.stringify({email: body.email});
          return fetch(`${rootPath}/login`, options);
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

    it ('returns token if email and password are correct', done => {
      let options = Object.create(fetchOptions);
      let body = {email: 'validuser@email.com', password: 'validpassword', confirmPassword: 'validpassword'};
      options.body = JSON.stringify(body);
      fetch(`${rootPath}/register`, options)
        .then(() => {
          return fetch(`${rootPath}/login`, options);
        })
        .then(response => {
          assert(response.ok);
          return response.json();
        })
        .then(body => {
          expect(body.token).to.exist;
          done();
        })
        .catch(done);
    });
  });
});

// private

function init () {
  let server;
  let dbConnection;

  before(done => {
    server = app.listen(testPort, () => {
      dbConnection = mongoose.connect(testDb);
      done();
    });
  });

  after(done => {
    dropUsers((err, result) => {
      server.close();
      dbConnection.disconnect();
      done();
    });
  });
}

function dropUsers (callback) { // dangerous operaion, so I decided to not move it to User. Probably will move to test helpers
  db.db.dropCollection('users', callback);
}