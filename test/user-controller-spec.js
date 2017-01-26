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

// mongoose.connect(testDb);

describe('User', () => {
  init();

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

function dropUsers (callback) { // dangerous operaion, so I decided to not move it to User. Probably will move to test helpers
  db.db.dropCollection('users', callback);
}