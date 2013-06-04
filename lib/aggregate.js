var request = require('request');
var async   = require('async');

module.exports = function aggregate(config, cb) {
  var self = new Aggregate(config);

  self.getJson(self.service + '/rate_limit', {}, function (err, body, params) {
    if (err) {
      return cb(err);
    }

    self.remaining = body.rate.remaining;

    self.execute(cb);
  });
};

function Aggregate(config) {
  this.config    = config;
  this.service   = 'https://api.github.com';
  this.remaining = 0;
}

Aggregate.prototype.execute = function(cb) {
  var self  = this;
  var owner = 'kvz';
  var repo  = 'phpjs';

  for (var type in this.config) {
    for (var i in this.config[type]) {
      var path   = this.config[type][i].replace('{owner}', owner).replace('{repo}', repo);
      var url    = this.service + path;
      var params = {
        url:   url,
        path:  path,
        type:  type,
        owner: owner,
        repo:  repo
      };

      self.remaining--;
      if (self.remaining <= 1) {
        return cb('Only ' + self.remaining + ' API requests remaining before hitting rate limiter. Aborting. ');
      }

      self.getJson(url, params, function (err, body, params) {
        if (err) {
          return cb(err);
        }

        self.findUsers(body, params, function(err, users, params) {
          if (err) {
            return cb(err);
          }

          if (!users.length) {
            return cb('Unable to find a user in ' + params.url);
          }

          for (var j in users) {
            console.log(params.type, users[j].login);
          }
        });
      });
    }
  }
};

Aggregate.prototype.findUsers = function(body, params, cb) {
  var users = [];
  if ('login' in body) {
    users.push(body);
  } else if ('user' in body) {
    users.push(body.user);
  } else {
    for (var key in body) {
      if ('login' in body[key]) {
        users.push(body[key]);
      } else if ('user' in body[key]) {
        users.push(body[key].user);
      }
    }
  }

  return cb(null, users, params);
};

Aggregate.prototype.getJson = function(url, params, cb) {
  var opts = {
    url:     url,
    json:    true,
    headers: {
      "User-Agent": "on-the-githubs"
    }
  };
  request.get(opts, function (err, res, body) {
    var announce = 'Error while downloading ' + res.request.href + '. ';
    if (err) {
      return cb(announce + err, body);
    }
    if (res.statusCode != 200 || body.message) {
      return cb(announce + res.headers.status + ': ' + body.message, body);
    }
    cb(null, body, params);
  });
};
