const mongoose = require('mongoose');

const config = require('./config');
const app = require('./server-core');
const port = 4000;

mongoose.connect(config.db);
const db = mongoose.connection;

db.on('error', error => {
  console.error('DB connection error');
  console.log(error);
});

db.once('open', () => {
  console.log('DB connected');

  app.listen(port, () => {
    console.log('Server is running on port ' + port);
  });
});
