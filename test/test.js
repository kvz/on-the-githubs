var assert       = require('assert');
var onTheGithubs = require('..');
var agg          = onTheGithubs.aggregate(null, {
  concurrency: 2,
  user: 'kvz',
  repo: 'nsfailover,on-the-githubs',
  userpaths: {
    contributors: [
      // '/orgs/{user}/members',
      '/repos/{user}/{repo}/contributors',
      // '/repos/{user}/{repo}/collaborators'
    ],
    collaborators: [
      '/repos/{user}/{repo}/issues/comments',
      '/repos/{user}/{repo}/issues'
    ],
    watchers: [
      '/repos/{user}/{repo}/subscribers',
      '/repos/{user}/{repo}/stargazers'
    ]
  }
});


// Overwrite getJson to avoid api call. have fixture_json
agg.getJsonOriginal = agg.getJson;

// Disable debug for cleaner test output
agg.debug = function () {};

var fixture_rate_limit_allow = {
  rate: {
    limit: 60,
    remaining: 60,
    reset: 1372931865
  }
};
var fixture_rate_limit_deny = {
  rate: {
    limit: 60,
    remaining: 2,
    reset: Math.floor((new Date()).getTime()/1000)+70
  }
};

var fixture_task = {
  url: 'https://api.github.com/repos/kvz/nsfailover/contributors?per_page=100',
  path: '/repos/kvz/nsfailover/contributors',
  type: 'contributors',
  user: 'kvz',
  repo: 'nsfailover'
};

var fixture_json = [{
  login: "tim-kos",
  id: 15005,
  avatar_url: "https://secure.gravatar.com/avatar/9c31d1102d95104fb994ae67cd1989b6?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png",
  gravatar_id: "9c31d1102d95104fb994ae67cd1989b6",
  url: "https://api.github.com/users/tim-kos",
  html_url: "https://github.com/tim-kos",
  followers_url: "https://api.github.com/users/tim-kos/followers",
  following_url: "https://api.github.com/users/tim-kos/following{/other_user}",
  gists_url: "https://api.github.com/users/tim-kos/gists{/gist_id}",
  starred_url: "https://api.github.com/users/tim-kos/starred{/user}{/repo}",
  subscriptions_url: "https://api.github.com/users/tim-kos/subscriptions",
  organizations_url: "https://api.github.com/users/tim-kos/orgs",
  repos_url: "https://api.github.com/users/tim-kos/repos",
  events_url: "https://api.github.com/users/tim-kos/events{/privacy}",
  received_events_url: "https://api.github.com/users/tim-kos/received_events",
  type: "User"
}, {
  login: "kvz",
  id: 26752,
  avatar_url: "https://secure.gravatar.com/avatar/3210e1be3e4059b93c4a88309e2183a2?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png",
  gravatar_id: "3210e1be3e4059b93c4a88309e2183a2",
  url: "https://api.github.com/users/kvz",
  html_url: "https://github.com/kvz",
  followers_url: "https://api.github.com/users/kvz/followers",
  following_url: "https://api.github.com/users/kvz/following{/other_user}",
  gists_url: "https://api.github.com/users/kvz/gists{/gist_id}",
  starred_url: "https://api.github.com/users/kvz/starred{/user}{/repo}",
  subscriptions_url: "https://api.github.com/users/kvz/subscriptions",
  organizations_url: "https://api.github.com/users/kvz/orgs",
  repos_url: "https://api.github.com/users/kvz/repos",
  events_url: "https://api.github.com/users/kvz/events{/privacy}",
  received_events_url: "https://api.github.com/users/kvz/received_events",
  type: "User"
}];

describe('aggregate', function(){
  describe('grepUsers', function(){
    it('should find 2 users', function(){
      agg.grepUsers(fixture_json, fixture_task, function(err, users, task) {
        assert.equal(2, users.length);
      });
    });
    it('should find 1 users', function(){
      var body = fixture_json;
      delete body[1];
      agg.grepUsers(body, fixture_task, function(err, users, task) {
        assert.equal(1, users.length);
      });
    });
  });

  describe('createTasks', function(){
    it('should return 12 tasks', function(){
      var tasks = agg.createTasks(agg.config.userpaths);
      assert.equal('https://api.github.com/repos/kvz/nsfailover/contributors?per_page=100', tasks[0].url);
      assert.equal(10, tasks.length);
    });
  });

  describe('doTask', function(){
    it('should find users', function(){
      agg.getJson = function(task, bypassCache, cb) {
        cb(null, fixture_json, task);
      };
      agg.doTask(null, fixture_task, function(err, users, task) {
        assert.equal(1, users.length);
      });
      agg.getJson = agg.getJsonOriginal;
    });
  });

  describe('rateLimiter', function(){
    it('should allow by rate limit', function(){
      agg.getJson = function(task, bypassCache, cb) {
        cb(null, fixture_rate_limit_allow, task);
      };
      agg.rateLimiter(function(err, timeout) {
        assert.equal(1, timeout);
      });
      agg.getJson = agg.getJsonOriginal;
    });

    it('should deny by rate limit and have a variable timeout higher than 60s', function(){
      agg.getJson = function(task, bypassCache, cb) {
        cb(null, fixture_rate_limit_deny, task);
      };
      agg.rateLimiter(function(err, timeout) {
        assert.equal(true, timeout > 60);
      });
      agg.getJson = agg.getJsonOriginal;
    });
  });
});
