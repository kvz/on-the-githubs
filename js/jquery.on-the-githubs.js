(function( $ ) {

  $.fn.onthegithubs = function( options ) {

    var settings = $.extend({
    // event-source: "repos/kvz/nsfailover",
    }, options || {});
    var self = this;

    var makeHtmlUrl = function (url) {
      var result = url;

      result = result.replace(/\/users\//, '/');
      result = result.replace(/\/repos\//, '/');
      result = result.replace(/\/api\./, '/');
      result = result.replace(/\/commits\//, '/commit/');

      return result;
    };

    var templater = function (template, vars) {
      return template.replace(/\{([^\}]*)\}/g, function(m, key) {
        return vars.hasOwnProperty(key) ? vars[key] : "";
      });
    };

    var escapeHtml = function (unsafe) {
      return unsafe
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
    };

    var download = function (source) {
      if (!source) {
        throw Error('Please set an event source like "orgs/tus" via data-event-source attr or options');
      }

      var d       = $.Deferred();
      var githubs = localStorage.getItem('on-the-githubs-feed-' + source);
      var time    = localStorage.getItem('on-the-githubs-date-' + source);
      var now     = +new Date() / 1000;
      var url     = 'https://api.github.com/' + source + '/events?per_page=20&callback=?';

      githubs = JSON.parse(githubs);
      if (githubs && githubs.data && time && now - time < 3 * 60) {
        d.resolve(githubs);
        return d;
      }

      $.getJSON(url, function(data, textStatus, jqXHR) {
        if (data.data.message) {
          throw Error('GitHub says: ' + data.data.message + ' for url: ' + url);
        }
        data.data = data.data.slice(0, 20);

        localStorage.setItem('on-the-githubs-feed-' + source, JSON.stringify(data));
        localStorage.setItem('on-the-githubs-date-' + source, now);
        d.resolve(data);
      });

      return d;
    };

    return this.each(function() {
      var $obj  = $(this);
      var eventSource;
      var val;
      if ((val = settings['event-source'])) {
        eventSource = val;
      } else if ((val = $obj.data('event-source'))) {
        eventSource = val;
      }

      download(eventSource).done(function (data) {
        $obj.html('');

        var template = '<abbr class="timeago" title="{created}">{created}</abbr>';
        template    += '<img src="{gravatarSrc}" class="gravatar" />';
        template    += '<p><a target="_blank" href="{userUrl}" class="author">{username}</a> ';
        template    += '<span>{action}</span>';
        template    += ' <a target="_blank" href="{repoUrl}">{repoName}</a>{branch}{commits}</p>';
        template    += '<div class="clearfix"></div>';

        for (var i = 0; i < data.data.length; i++) {
          var item = data.data[i];

          var gravatarSrc = item.actor.avatar_url;
          var username    = item.actor.login;
          var action      = '';
          var branch      = '';
          var commits     = '';

          // http://developer.github.com/v3/activity/events/types/
          var isClosed = false;

          switch (item.type) {
            case 'IssuesEvent':
              // console.log(item);
              isClosed = item.payload.issue.state === 'closed';
              action   = item.payload.action + ' ';
              action  += 'issue <a target="_blank" href="' + item.payload.issue.html_url + '">';

              if (isClosed) {
                action += '<s>';
              }
              action += item.payload.issue.title;
              if (isClosed) {
                action += '</s>';
              }

              action += '</a> on';
              break;
            case 'CommitCommentEvent':
              action  = 'commented “' + escapeHtml(item.payload.comment.body) + '” ';
              action += 'on a commit to <a target="_blank" href="' + item.payload.comment.html_url + '">';
              action += item.payload.comment.path + '</a> in';
              break;
            case 'IssueCommentEvent':
              isClosed = item.payload.issue.state === 'closed';

              action  = 'commented on <a target="_blank" href="' + item.payload.comment.html_url + '">';
              if (isClosed) {
                action += '<s>';
              }
              action += escapeHtml(item.payload.issue.title);
              if (isClosed) {
                action += '</s>';
              }
              action += '</a> in';
              break;
            case 'PushEvent':
              // var commitString = item.payload.commits.length === 1 ? 'commit' : 'commits';

              if (!item.payload || !item.payload.commits || item.payload.commits.length === 0) {
                break;
              }
              var firstCommit = item.payload.commits[0].sha;
              var firstUrl    = makeHtmlUrl(item.payload.commits[0].url);
              var lastCommit  = '';
              var messages    = [];
              var msg         = '';
              for (var j in item.payload.commits) {
                lastCommit = item.payload.commits[j].sha;
                msg = item.payload.commits[j].message.substr(0, 50);
                if (msg.length > item.payload.commits[j].message.length) {
                  msg += ' ...';
                }
                msg = escapeHtml(msg)
                messages.push(msg);
              }
              var compareUrl  = firstUrl.replace('commit', 'compare').replace(firstCommit, firstCommit + '...' + lastCommit);
              var txtMessages = messages.join(' &mdash; ');
              txtMessages = escapeHtml(txtMessages)

              action  = 'pushed ';
              if (item.payload.commits.length === 1) {
                action += '<a target="_blank" rel="tooltip" data-placement="right" title="' + txtMessages + '" href="' + firstUrl + '">';
                action += '1 commit';
                action += '</a>';
              } else {
                action += '<a target="_blank" rel="tooltip" data-placement="right" title="' + txtMessages + '" href="' + compareUrl + '">';
                action += item.payload.commits.length + ' ' + 'commits';
                action += '</a>';
              }
              action += ' to';

              // commits = '<ul class="commits">';
              // for (var j in item.payload.commits) {
              //   var commit = item.payload.commits[j];

              //   var sha = commit.sha.substr(0, 7);
              //   var msg = commit.message.substr(0, 50);
              //   if (msg.length !== commit.message.length) {
              //     msg += ' ...';
              //   }

              //   commits += '<li>';
              //   commits += '<a href="' + makeHtmlUrl(commit.url) + '">' + sha + '</a>';
              //   commits += ' ' + msg;
              //   commits += '</li>';
              // }

              // commits += '</ul>';
              // console.log(item.type, item);
              break;
            case 'ForkEvent':
              action = 'forked';
              break;
            case 'WatchEvent':
              action = 'is now watching';
              break;
            case 'PullRequestEvent':
              action  = item.payload.action + ' ';
              action += 'pull request <a target="_blank" href="' + item.payload.pull_request.html_url + '">';
              action += item.payload.pull_request.title;
              action += '</a> for';

              break;
            case 'CreateEvent':
              action = 'created a new ' + item.payload.ref_type + ' in';
              branch = ': <a target="_blank" href="https://github.com/' + item.repo.name + '/tree/' + item.payload.ref + '">' + item.payload.ref + '</a>';
              break;
            default:
              console.log(item.type, item);
              break;
          }

          var entry = templater(template, {
            gravatarSrc: gravatarSrc,
            userUrl: makeHtmlUrl(item.actor.url),
            username: username,
            repoUrl: makeHtmlUrl(item.repo.url),
            repoName: item.repo.name,
            branch: branch,
            created: item.created_at,
            action: action,
            commits: commits
          });

          $('<li/>').append(entry).appendTo($obj);
        }

        if ('timeago' in $('abbr.timeago')) {
          $('abbr.timeago').timeago();
        }
        if ('tooltip' in $('a[rel]')) {
          $('a[rel]').tooltip();
        }
      });
    });
  };
}( jQuery ));
