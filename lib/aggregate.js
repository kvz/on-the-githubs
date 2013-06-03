var request = require('request');
var async   = require('async');

module.exports = function aggregate(config, cb) {
  var aggregate = new Aggregate(config);
  aggregate.execute(cb);
};

function Aggregate(config) {
  this.config = config;
}

Aggregate.prototype.execute = function(cb) {
  var self  = this;
  var owner = 'kvz';
  var repo  = 'phpjs';

  var types = {
    contributors: [
      // '/orgs/{owner}/members',
      '/repos/{owner}/{repo}/collaborators',
      '/repos/{owner}/{repo}/contributors',
    ],
    collaborators: [
      '/repos/{owner}/{repo}/issues/comments',
      '/repos/{owner}/{repo}/issues',
    ],
    watchers: [
      '/repos/{owner}/{repo}/subscribers',
      '/repos/{owner}/{repo}/stargazers',
    ],
  };

  for (var type in types) {
    for (var i in types[type]) {
      var path = types[type][i];
      path = path.replace('{owner}', owner);
      path = path.replace('{repo}', repo);
      path = 'https://api.github.com' + path;

      self.getJson(path, function (err, body) {
        if (err) {
          return cb(err);
        }
        if ('login' in body) {
          self.addUser(path, type, body);
        } else if ('user' in body) {
          self.addUser(path, type, body.user);
        } else {
          for (var key in body) {
            if ('user' in body[key]) {
              self.addUser(path, type, body[key].user);
            }
          }
        }
      }); 
    }
  }
};

Aggregate.prototype.addUser = function(path, type, user, cb) {
  console.log(path, type, user.login);
}

Aggregate.prototype.getJson = function(url, cb) {
  var opts = {
    url: url, 
    json: true, 
    headers: {
      "User-Agent": "on-the-githubs"
    }
  };
  request.get(opts, function (err, res, body) {
    var announce = 'Error while downloading ' + res.request.href + '. ';
    if (err) {
      return cb(announce + err);
    }
    if (res.statusCode != 200 || body.message) {
      return cb(announce + res.headers.status + ': ' + body.message);
    }
    cb(null, body);
  });
}
