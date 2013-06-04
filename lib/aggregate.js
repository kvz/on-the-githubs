var request = require('request');
var async   = require('async');

module.exports = function aggregate(config, cb) {
  var self = new Aggregate(config);

  self.getJson({url: self.service + '/rate_limit'}, function (err, body, params) {
    if (err) {
      return cb(err);
    }

    self.rate_remaining = body.rate.remaining;

    self.execute(cb);
  });
};

function Aggregate(config) {
  this.config         = config;
  this.service        = 'https://api.github.com';
  this.rate_remaining = 0;
  this.paginate       = true;
  this.todos          = [];
  this.done           = 0;
  this.total          = 0;
  this.all_users = {};
}

Aggregate.prototype.addTodo = function(params) {
  console.log('Adding todo: ' + params.url);
  this.todos.push(params);
  this.total++;
};

Aggregate.prototype.completeTodo = function(params) {
  console.log('Completed todo: ' + params.url);
  this.done++;
  return this.done === this.total;
};

Aggregate.prototype.takeTodo = function() {
  if (this.todos.length === 0) {
    return null;
  }
  var params = this.todos.shift();
  console.log('Taking todo: ' + params.url);
  return params;
};

Aggregate.prototype.execute = function(cb) {
  var self      = this;
  var owner     = 'kvz';
  var repo      = 'phpjs';

  // Distill intial todos from config, owner & repo
  for (var type in this.config) {
    for (var i in this.config[type]) {
      var path   = this.config[type][i].replace('{owner}', owner).replace('{repo}', repo);
      var url    = this.service + path + '?per_page=100';
      var params = {
        url:   url,
        path:  path,
        type:  type,
        owner: owner,
        repo:  repo
      };

      self.addTodo(params);
    }
  }

  // Can we process this many todos?
  if (self.todos.length >= self.rate_remaining) {
    return cb('Only ' + self.rate_remaining + ' API requests remaining before hitting rate limiter. Aborting. ');
  }

  // Keep looping until there are no more todos
  self.scanTodos(self, cb);
};

Aggregate.prototype.scanTodos = function(self, cb) {
  var todo = self.takeTodo();
  // if (todo === null) {
  //   continue;
  // }
  todo && self.getJson(todo, function (err, body, params) {
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
        // console.log(params.type, users[j].login);
        if (!self.all_users[params.type]) {
          self.all_users[params.type] = [];
        }
        self.all_users[params.type].push(users[j]);
      }

      if (self.completeTodo(todo) === true) {
        console.log('All Done. ', done, self.todos.length);
        return cb(null, self.all_users);
      }
    });
  });

  setTimeout(function() {
    self.scanTodos(self, cb);
  }, 1000);
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
  console.log('Downloading url ' + params.url);
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

    if (res.headers.link && self.paginate === true) {
      // <https://api.github.com/repositories/296239/stargazers?page=2>; rel="next"
      var raw_links = res.headers.link.split(', ');
      for (var j in raw_links) {
        if (raw_links[j].split('; ')[1] === 'rel="next"') {
          var next_params = params;
          next_params.url = raw_links[j].split('; ')[0].replace('<', '').replace('>', '');
          self.addTodo(next_params);
        }
      }
    }

    cb(null, body, params);
  });
};
