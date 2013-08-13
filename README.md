on-the-githubs [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]
===============
[![Flattr][FlattrIMGURL]][FlattrURL]

[NPMIMGURL]:                https://badge.fury.io/js/cloudcmd.png
[BuildStatusIMGURL]:        https://secure.travis-ci.org/kvz/on-the-githubs.png?branch=master
[DependencyStatusIMGURL]:   https://gemnasium.com/kvz/on-the-githubs.png
[FlattrIMGURL]:             http://api.flattr.com/button/flattr-badge-large.png
[NPMURL]:                   //npmjs.org/package/on-the-githubs
[BuildStatusURL]:           //travis-ci.org/kvz/on-the-githubs  "Build Status"
[DependencyStatusURL]:      //gemnasium.com/kvz/on-the-githubs "Dependency Status"
[FlattrURL]:                https://flattr.com/submit/auto?user_id=kvz&url=github.com/kvz/on-the-githubs&title=on-the-githubs&language=&tags=github&category=software

Demo: http://kvz.github.io/on-the-githubs/#kvz/nsfailover

To grow an open-source community it helps if your site has an active overview of what's going on and who
is contributing.

The GitHub API3 provides all the information we need, but you may hit rate-limiters, or find it hard / have no time to embed this data into your website.

This project aims to make it deadsimple to add community info & activity feeds. It's split
into two subprojects:

- **ghcommunity** - Downloads all involved community members, saves it as json or html so you can include it in your build procedure.
- **ghevents**
A jquery plugin for a near-realtime overview of events in 1 project or organisation. Does not require any buildsteps or setup, just add a few lines of code to your project's page.


## ghevents example

Demo: http://kvz.github.io/on-the-githubs/#kvz/nsfailover
Or your own: http://kvz.github.io/on-the-githubs/#`<user>`/`<repo>`

To embed this into your site, add a few lines of code:

	<link href="//kvz.github.io/on-the-githubs/css/on-the-githubs.min.css" rel="stylesheet" />

	<div class="on-the-githubs-events" data-event-source="repos/kvz/nsfailover">Loading...</div>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="//kvz.github.io/on-the-githubs/js/jquery.ghevents.min.js"></script>

	<script type="text/javascript">
		$('.on-the-githubs-events').ghevents();
		// If you use bootstrap and want to enable tooltips
		// $('a[rel]').tooltip();
	</script>

Don't forget to change the `data-event-source` to repos/`<user>`/`<repo>`.


## ghevents development

For local development, here's how to run the repo-included demo:

```bash
npm install --dev
make build
node demo-server.js
```

- Point your browser to http://127.0.0.1:8080

## ghcommunity examples

Get all people involved with `kvz/nsfailver` and echo as json to `stdout`

```bash
./bin/ghcommunity-cache --user kvz --repo nsfailover --format json --output -
```

Index an entire organization, read `test/about.md`, search it for the `{{ghcommunity}}` tag,
replace it with the entire `tus` community, write it to `test/about-with-ghcommunity.md`, do this with `1` request at a time, to ensure the order of userpaths. Enable `debug`ging to see what's going on, because with the amount of API requests & GitHubs rate-limiting, this is going to take a while (the script automatically waits as to not have your IP banned by GitHub).

```bash
./bin/ghcommunity-cache \
 --user tus \
 --repo tus.io,tusd,tus-jquery-client,tus-ios-client,tus-android-client,tus-resumable-upload-protocol \
 --format html \
 --concurrency 1 \
 --input demo.html \
 --tag '<div class="on-the-githubs-community" />' \
 --output demo-with-community.html \
 --debug
```

Help:

```bash
./bin/ghcommunity-cache -h
```

## Integrate ghcommunity

Let's say your site is now built with Jekyll into `./_site`.
You have an `about.md` that you want to add community faces to.

First, let's make on-the-githubs a dependency:

```bash
[ -d node_modules ] || mkdir node_modules
npm install on-the-githubs --save
```

Now add something like this to a `Makefile`:

```bash
community:
	node_modules/on-the-githubs/bin/ghcommunity-cache \
	 --user tus \
	 --repo tusd,tus-jquery-client \
	 --format html \
	 --concurrency 1 \
	 --input _site/about.html \
	 --tag '<p>replaced-by-on-the-githubs</p>' \
	 --output _site/about.html \
	 --debug
```

Now if you type `make community` after `jekyll build`, on-the-githubs will look for the
`<p>replaced-by-on-the-githubs</p>` placeholder, and replace it with all the involved GitHub
profiles.

By default, `ghcommunity-cache` caches to `~/.on-the-githubs/` to avoid rate-limiters.

## Requirements

- Node 0.8+

## License

This project is licensed under the MIT license, see `LICENSE.txt`.

Contains code of [jquery-timeago](https://github.com/rmm5t/jquery-timeago)
by [Ryan McGeary](https://github.com/rmm5t/jquery-timeago/blob/master/LICENSE.txt)
