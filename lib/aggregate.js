var request = require('request');
var async   = require('async');

module.exports = function aggregate(cli, config, cb) {
  var self = new Aggregate(cli, config);
  self.execute(cb);
};

function Aggregate(cli, config) {
  this.cli      = cli;
  this.config   = config;
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
  var owner = this.config.owner;
  var repo  = this.config.repo;

  // Distill intial tasks from config, owner & repo
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

      this.addTask(params);
    }
  }

  // Keep looping until there are no more tasks
  this.pollTask(this, cb);
};

Aggregate.prototype.pollTask = function(self, cb) {
  var task = self.takeTask();

  if (task) {
    self.getJson(task, function (err, body, params) {
      if (err) {
        self.completeTask(task);
        return cb(err);
      }

      self.findUsers(body, params, function(err, users, params) {
        if (err) {
          self.completeTask(task);
          return cb(err);
        }

        if (!users.length) {
          self.completeTask(task);
          return cb('Unable to find a user in ' + params.url);
        }

        for (var j in users) {
          if (!self._allUsers[params.type]) {
            self._allUsers[params.type] = [];
          }
          self._allUsers[params.type].push(users[j]);
        }

        if (self.completeTask(task) === true) {
          // All tasks are complete self.completeTask(task) === true
          // so return all users here and stop polling to end the event loop
          clearTimeout(self._taskTimer);
          return cb(null, self._allUsers);
        }
      });
    });
  }

  self.taskTimeout(function (err, timeout) {
    if (err) {
      return cb(err);
    }

    self._taskTimer = setTimeout(function() {
      self.pollTask(self, cb);
    }, timeout);
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
      // <https://api.github.com/repositories/296239/stargazers?page=2>; rel="next"
      var raw_links = res.headers.link.split(', ');
      for (var j in raw_links) {
        if (raw_links[j].split('; ')[1] === 'rel="next"') {
          var next_params = params;
          next_params.url = raw_links[j].split('; ')[0].replace('<', '').replace('>', '');
          self.addTask(next_params);
        }
      }
    }

    cb(null, body, params);
  });
};

Aggregate.prototype.taskTimeout = function(cb) {
  var self = this;
  self.getJson({url: self.config.service + '/rate_limit'}, function (err, body, params) {
    if (err) {
      return cb(err);
    }

    self.debug(body.rate.remaining + ' requests remaining before hitting ratelimit. ');
    var timeout = 1000;
    if (body.rate.remaining <= 10) {
      self.info('Only ' + body.rate.remaining + ' requests remaining before hitting ratelimit. Sleeping 1 minute... ');
      timeout = 61000;
    }

    cb(null, timeout);
  });
};

Aggregate.prototype.addTask = function(params) {
  this.info('Adding task: ' + params.url);
  this._tasks.push(params);
  this._tasksTotal++;
};

Aggregate.prototype.completeTask = function(params) {
  this.ok('Completed task: ' + params.url);
  this._tasksDone++;
  return this._tasksDone === this._tasksTotal;
};

Aggregate.prototype.takeTask = function() {
  if (this._tasks.length === 0) {
    this.info('No tasks now, but more could be added by current tasks in progress');
    return null;
  }
  var params = this._tasks.shift();
  this.info('Taking task: ' + params.url);
  return params;
};
