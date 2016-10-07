'use strict';

const {assert, expect} = require('chai');
const fetch = require('node-fetch');
const app = require('../src/server-core');

const testPort = 4000;

describe('Server initialization', () => {
  let server;
  before(done => {
    server = app.listen(testPort, done);
  });
  after(() => server.close());

  it ('should respond to requests', done => {
    fetch(`http://localhost:${testPort}/api/`)
    .then(response => {
      assert(response.ok);
      done();
    })
    .catch(done);
  });
});