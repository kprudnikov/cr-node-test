![Codeship][https://codeship.com/projects/068903b0-c608-0134-83a8-5aca8525b5fa/status?branch=master]

# Setup:

[Install mongodb](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)

```sh
$ npm install
$ mongod
$ npm start
```

To run unit tests
```sh
$ npm test
```

Optionally -- create `data/` folder and run
```sh
$ mongod --dbpath=data
```
