var Client = require('request-json').JsonClient;
var client = new Client('https://api.github.com/');
var async = require('async');

module.exports = function aggregate(config, cb) {
  var aggregate = new Aggregate(config);
  aggregate.execute(cb);
};

function Aggregate(config) {
  this.config = config;
}

Aggregate.prototype.execute = function(cb) {
  // an example using an object instead of an array
  async.parallel({
    user: this.getUser,
  },
  function(err, results) {
    // results is now equals to: {one: 1, two: 2}
    if (err) {
      console.log(err);
    } else {
      console.log(results);
    }
  });  
};

Aggregate.prototype.getUser = function(cb) {
  // get user information
  client.get('/tus/tusd/collaborators.json', function(err, res, body) {
    if (err) {
      return cb('Error while downloading ' + res.request.href + ' ' + err);
    }
    if (body.message) {
      return cb(body.message);
    }
    cb(null, body);
  });  
};
