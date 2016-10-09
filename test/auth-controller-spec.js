'use strict';

const {assert, expect} = require('chai');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

const app = require('../src/server-core');
const {testDb, testPort, rootPath} = require('./test-config');
const {User} = require('../src/models/user');

const db = mongoose.connection;
const fetchOptions = {
  headers: {'Content-Type': 'application/json', 'User-Agent': 'Fetch'},
  method: 'POST',
};

mongoose.connect(testDb);

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

  describe ('get me', () => {
    let token;
    let mePath = `${rootPath}/me`;

    before(done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'me@email.com', password: 'mypassword', confirmPassword: 'mypassword'});

      fetch(`${rootPath}/register`, options)
        .then(response => {
          return response.json();
        })
        .then(body => {
          token = body.token;
          done();
        })
        .catch(done);
    });

    it ('returns an error if sent without token', done => {
      fetch(mePath, {method: 'get'})
        .then(response => {
          assert(response.status === 401);
          return response.json();
        })
        .then(body => {
          expect(body.message).to.exist;
          done();
        })
        .catch(done);
    });

    it ('accepts token as header', done => {
      let options = Object.create(fetchOptions);
      options.method = 'get';
      options.headers = Object.assign({}, fetchOptions.headers);
      options.headers['Authorization'] = token;
      fetchMe(mePath, options, done);
    });

    it ('accepts token as query', done => {
      let options = Object.create(fetchOptions);
      let path = mePath + '?token=' + token;
      options.method = 'get';
      fetchMe(path, {}, done);
    });
  });

  describe ('edit me', () => {
    let token;
    const editOptions = Object.create(fetchOptions);
    const mePath = `${rootPath}/me`;

    editOptions.method = 'put';
    editOptions.headers = Object.assign({}, fetchOptions);

    beforeEach(done => {
      let options = Object.create(fetchOptions);
      options.body = JSON.stringify({email: 'editme@email.com', password: 'mypassword', confirmPassword: 'mypassword'});

      fetch(`${rootPath}/register`, options)
        .then(response => {
          return response.json();
        })
        .then(body => {
          token = body.token;
          done();
        })
        .catch(done);
    });

    afterEach(done => {
      User.findOneAndRemove({email: 'editme@email.com'}, done);
    });

    it ('returns an error if sent without token', done => {
      let options = Object.create(editOptions);
      options.body = JSON.stringify({email: 'thiswillnever@reach.db'});

      fetch(mePath, options)
        .then(response => {
          assert(response.status === 401);
          return response.json();
        })
        .then(body => {
          expect(body.message).to.exist;
          done();
        })
        .catch(done);
    });

    it ('updates email', done => {
      let options = Object.create(editOptions);
      options.headers = Object.assign({}, fetchOptions.headers);
      options.headers.Authorization = token;
      options.body = JSON.stringify({email: 'should@update.db'});

      fetch(mePath, options)
        .then(response => {
          assert(response.ok);
          return response.json();
        })
        .then(body => {
          assert(body.email === 'should@update.db');
          done();
        })
        .catch(done);
    });
    it ('updates password');
    it ('throws error if user password !== entered password when attempting to change password');
    it ('updates multiple parameters in a single request');
    it ('accepts token in body');
    it ('accepts token in header');
    it ('accepts token in query');
  });
});

// private

function init () {
  let server;

  before(done => {
    server = app.listen(testPort, done);
  });

  after(() => {
    dropUsers((err, result) => {
      server.close();
    });
  });
}

function dropUsers (callback) {
  db.db.dropCollection('users', callback);
}

function fetchMe (path, options, done) {
  fetch(path, options)
    .then(response => {
      assert(response.ok);
      return response.json();
    })
    .then(body => {
      expect(body.id).to.exist;
      expect(body.email).to.exist;
      done();
    })
    .catch(done);
}
