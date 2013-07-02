var request = require('request');
var async   = require('async');

module.exports = function aggregate(cli, config, cb) {
  var self = new Aggregate(cli, config);
  self.execute(cb);
};

function Aggregate(cli, config) {
  this.cli    = cli;
  this.config = config;
  if (!('service' in this.config)) {
    this.config.service = 'https://api.github.com';
  }
  if (!('paginate' in this.config)) {
    this.config.paginate = true;
  }

  this._taskTimer  = null;
  this._tasks      = [];
  this._tasksDone  = 0;
  this._tasksTotal = 0;

  this._allUsers = {};
}

Aggregate.prototype.debug = function(str) {
  return this.cli.debug(str);
};
Aggregate.prototype.ok = function(str) {
  return this.cli.ok(str);
};
Aggregate.prototype.info = function(str) {
  return this.cli.info(str);
};

Aggregate.prototype.execute = function(cb) {
  var self  = this;

  // Setup async's queuing system
  self.q = async.queue(function (task, cb) {
    self.rateLimiter(function (err) {
      if (err) {
        return cb(err);
      }

      self.doTask(self, task, cb);
    });
  }, self.config.concurrency);

  // Distill intial tasks from config, owner & repo
  var owner = self.config.owner;
  var repo  = self.config.repo;
  for (var type in this.config.userpaths) {
    for (var i in this.config.userpaths[type]) {
      var path   = this.config.userpaths[type][i].replace('{owner}', owner).replace('{repo}', repo);
      var url    = this.config.service + path + '?per_page=100';
      var params = {
        url:   url,
        path:  path,
        type:  type,
        owner: owner,
        repo:  repo
      };

      self.q.push(params, function (err) {
        if (err) {
          return cb(err);
        }
      });
    }
  }

  // When all items have been processed, hit our mother-callback
  self.q.drain = function () {

    // Squash. More important && earlier contributions take precedence
    if (self.config.squash === true) {
      var newUsers = {};
      var allreadyHave = {};
      for (var type in this._allUsers) {
        newUsers[type] = [];
        for (var i in this._allUsers[type]) {
          var user = this._allUsers[type][i];
          if (!allreadyHave[user.login]) {
            newUsers[type].push(user);
          }
          allreadyHave[user.login] = true;
        }
      }
      self._allUsers = newUsers;
    }

    cb(null, self._allUsers);
  };
};


Aggregate.prototype.doTask = function(self, task, cb) {
  self.debug('Doing task ' + task.url);
  if (!task) {
    return cb('Empty task');
  }

  self.getJson(task, function (err, body, params) {
    if (err) {
      return cb(err);
    }

    self.findUsers(body, params, function(err, users, params) {
      if (err) {
        return cb(err);
      }

      // It's possible to have 0 comments/issues/users
      // if (!users.length) {
      //   return cb('Unable to find a user in ' + params.url);
      // }

      for (var j in users) {
        if (!self._allUsers[params.type]) {
          self._allUsers[params.type] = [];
        }
        self._allUsers[params.type].push(users[j]);
      }

      cb(null, users[j]);
    });
  });
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

Aggregate.prototype.getJson = function(params, cb) {
  var self = this;
  var opts = {
    url:     params.url,
    json:    true,
    headers: {
      "User-Agent": "on-the-githubs"
    }
  };
  // self.debug('Downloading url ' + params.url);
  request.get(opts, function (err, res, body) {
    var announce = 'Error while downloading ' + params.url + '. ';
    if (err) {
      return cb(announce + err);
    }
    if (res.statusCode != 200 || body.message) {
      return cb(announce + res.headers.status + ': ' + body.message);
    }
    if (!res.headers) {
      return cb('No headers in response?!');
    }

    if (res.headers.link && self.config.paginate === true) {
      var raw_links = res.headers.link.split(', ');
      for (var j in raw_links) {
        if (raw_links[j].split('; ')[1] === 'rel="next"') {
          var next_params = params;
          next_params.url = raw_links[j].split('; ')[0].replace('<', '').replace('>', '');
          self.q.push(next_params, function (err) {
            if (err) {
              return cb(err);
            }
          });
        }
      }
    }

    cb(null, body, params);
  });
};

Aggregate.prototype.rateLimiter = function(cb) {
  var self = this;
  self.getJson({url: self.config.service + '/rate_limit'}, function (err, body, params) {
    if (err) {
      return cb(err);
    }

    self.debug(body.rate.remaining + ' requests remaining before hitting ratelimit. ');
    var timeout = 1000;
    if ((body.rate.remaining + self.config.concurrency) <= 2) {
      self.info('Only ' + body.rate.remaining + ' requests remaining before hitting ratelimit. Sleeping 1 minute... ');
      timeout = 61000;
    }

    setTimeout(cb, timeout);
  });
};
