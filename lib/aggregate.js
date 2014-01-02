var request = require('request');
var async   = require('async');
var fs      = require('fs');

var Cache       = require('cache-storage');
var FileStorage = require('cache-storage/Storage/FileStorage');

module.exports = function aggregate(cli, config, cb) {
  var self = new Aggregate(cli, config);
  return self;
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
  if (!('concurrency' in this.config)) {
    this.config.concurrency = 5;
  }

  if (!('cachdeDir' in this.config)) {
    var userDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
    this.config.cacheDir = userDir + '/.in-the-githubs';
  }

  this._taskTimer  = null;
  this._tasks      = [];
  this._tasksDone  = 0;
  this._tasksTotal = 0;

  this._allUsers = {};

  if (!fs.existsSync(this.config.cacheDir)) {
    fs.mkdirSync(this.config.cacheDir);
  }
  this.cache = new Cache(new FileStorage(this.config.cacheDir), 'aggregate');
}

Aggregate.prototype.debug = function(str) {
  if (!this.cli) {
    return console.log(str);
  }
  return this.cli.debug(str);
};
Aggregate.prototype.ok = function(str) {
  if (!this.cli) {
    return console.log(str);
  }
  return this.cli.ok(str);
};
Aggregate.prototype.info = function(str) {
  if (!this.cli) {
    return console.log(str);
  }
  return this.cli.info(str);
};

Aggregate.prototype.createTasks = function(userpaths) {
  var self  = this;
  var tasks = [];
  var repos = self.config.repo;
  var user  = self.config.user;
  repos = repos.split(/\s*,\s*/);
  for (var type in userpaths) {
    for (var i in userpaths[type]) {
      for (var j in repos) {
        var repo = repos[j];
        var path = userpaths[type][i]
          .replace('{user}', user)
          .replace('{repo}', repo);
        var url  = self.config.service + path + '?per_page=100';
        var task = {
          url:  url,
          path: path,
          type: type,
          user: user,
          repo: repo
        };

        tasks.push(task);
      }
    }
  }

  return tasks;
};

Aggregate.prototype.execute = function(final_cb) {
  var self  = this;

  // Setup async's queuing system
  self.q = async.queue(function (task, asyncTaskCb) {
    self.rateLimiter(function (err, timeoutSec) {
      if (err) {
        return final_cb(err);
      }

      setTimeout(function() {
        self.doTask(self, task, asyncTaskCb);
      }, timeoutSec * 1000);
    });
  }, self.config.concurrency);

  // Distill intial tasks from config, owner & repo
  var tasks = self.createTasks(self.config.userpaths);
  self.q.push(tasks, function (err, users) {
    if (err) {
      return final_cb(err);
    }
    self.debug('Queueitems left: ' + self.q.length());
  });

  // When all items have been processed, hit our mother-callback
  self.q.drain = function () {
    // Squash. More important && earlier contributions take precedence
    if (self.config.squash === true) {
      var newUsers     = {};
      var allreadyHave = {};
      for (var type in self._allUsers) {
        newUsers[type] = [];
        for (var i in self._allUsers[type]) {
          var user = self._allUsers[type][i];
          if (!allreadyHave[user.login]) {
            newUsers[type].push(user);
          }
          allreadyHave[user.login] = true;
        }
      }
      self._allUsers = newUsers;
    }

    final_cb(null, self._allUsers);
  };
};


Aggregate.prototype.doTask = function(self, task, doTaskCb) {
  if (!self) {
    self = this;
  }
  if (!task) {
    return doTaskCb('Empty task');
  }

  self.debug('Doing task: ' + task.url);
  self.getJson(task, false, function (err, body, task) {
    if (err) {
      return doTaskCb(err);
    }

    self.grepUsers(body, task, function(err, users, task) {
      if (err) {
        return doTaskCb(err);
      }

      if (users.length) {
        for (var j in users) {
          if (!self._allUsers[task.type]) {
            self._allUsers[task.type] = [];
          }
          self._allUsers[task.type].push(users[j]);
        }

        return doTaskCb(null, users);
      }

      // Be it empty users, we still have to mark this task as complete
      doTaskCb(null, []);
    });
  });
};

Aggregate.prototype.grepUsers = function(body, task, cb) {
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

  return cb(null, users, task);
};

Aggregate.prototype.rateLimiter = function(cb) {
  var self = this;
  self.getJson({url: self.config.service + '/rate_limit'}, true, function (err, body, task) {
    if (err) {
      return cb(err);
    }

    self.debug(body.rate.remaining + ' requests remaining before hitting ratelimit. ');
    var timeoutSec = 1;
    if ((body.rate.remaining - self.config.concurrency) <= 2) {
      var current_utc = Math.floor((new Date()).getTime()/1000);

      if ((timeoutSec = (body.rate.reset - current_utc)) < 0) {
        timeoutSec = 0;
      }
      timeoutSec += 5;

      self.debug('Only ' + body.rate.remaining + ' requests remaining before hitting ratelimit. Sleeping for ' + timeoutSec + 's... ');
    }

    return cb(err, timeoutSec);
  });
};

Aggregate.prototype.getJson = function(task, bypassCache, cb) {
  var self = this;
  var response  = self.cache.load(task.url);

  if (!bypassCache && response !== null) {
    self.debug('Pulled from cache: ' + task.url);
    self.moreTasksFromHeaders(response.headers, task);
    return cb(null, response.body, task);
  }

  self.fetchJson(task, function (err, response) {
    if (err) {
      return cb(err);
    }
    self.debug('Fetched from live: ' + task.url);

    self.cache.save(task.url, response, {
      expire: {days: 1}
    });
    self.moreTasksFromHeaders(response.headers, task);
    return cb(null, response.body, task);
  });

};

Aggregate.prototype.moreTasksFromHeaders = function(headers, task) {
  var self = this;
  if (headers.link && self.config.paginate === true) {
    var raw_links = headers.link.split(', ');
    for (var j in raw_links) {
      if (raw_links[j].split('; ')[1] === 'rel="next"') {
        var next_task = task;
        next_task.url = raw_links[j].split('; ')[0].replace('<', '').replace('>', '');
        self.q.push(next_task, function (err) {
          if (err) {
            self.error(err);
            // return cb(err);
          }
        });
      }
    }
  }
};

Aggregate.prototype.fetchJson = function(task, cb) {
  var self = this;
  var opts = {
    url:     task.url,
    json:    true,
    headers: {
      "User-Agent": 'in-the-githubs'
    }
  };
  request.get(opts, function (err, res, body) {
    var announce = 'Error while downloading ' + task.url + '. ';
    if (err) {
      return cb(announce + err);
    }
    if (res.statusCode != 200 || body.message) {
      return cb(announce + res.headers.status + ': ' + body.message);
    }
    if (!res.headers) {
      return cb('No headers in response?!');
    }

    cb(null, {
      "headers": res.headers,
      "body": body
    });
  });
};
