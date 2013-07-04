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

To grow an open-source community it helps if your site has an active overview of what's going on, and who
are contributors.

The GitHub API3 is wonderful and can provide all the information we need.

However you may hit rate-limiters, or find it hard / have no time to integrate the data into your website.

This project helps to address those things with 2 independent subprojects:

- **ghcommunity** - downloads all involved community members, saves it as json or html, so you can include it in your build procedure, or store it on s3 and then include in your site.
- **ghevents**
a jquery plugin for a near-realtime overview of events in 1 project or organisation. does not require any buildsteps or setup.


## ghevents examples


    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>

	<link href="//kvz.github.io/on-the-githubs/css/on-the-githubs.css" rel="stylesheet" />
	<div class="on-the-githubs-events" data-event-source="repos/kvz/nsfailover">
	Loading...
	</div>

    <script src="//kvz.github.io/on-the-githubs/js/jquery.timeago.js"></script>
    <script src="//kvz.github.io/on-the-githubs/js/jquery.ghevents.js"></script>

	<script type="text/javascript">
		$('.on-the-githubs-events').ghevents();
	</script>


## ghevents development

For local development, here's how to run the repo-included demo:

```bash
npm install --dev
node demo-server.js
```

- Point your browser to http://127.0.0.1:8080

## ghcommunity examples

Get all people involved with `kvz/nsfailver` and echo as json to `stdout`

```bash
./bin/ghcommunity-cache --user kvz --repo nsfailover --format json --output -
```

Index an entire organisation, read `test/about.md`, search it for the `{{ghcommunity}}` tag,
replace it with the entire `tus` community, write it to `test/about-with-ghcommunity.md`, do this with `1` request at a time, to ensure the order of userpaths. Enable `debug`ging to see what's going on, because with the amount of API requests & GitHubs rate-limiting, this is going to take a while (the script automatically waits as to not have your IP banned by GitHub).

![screen shot 2013-07-04 at 5 26 12 pm](https://f.cloud.github.com/assets/26752/750475/4ab48536-e4cc-11e2-9a69-f0c9e7c2765e.png)

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

## Todo

 - [ ] Caching in `~/.on-the-githubs`
 - [ ] Shipping automation
 - [ ] Respect `reset` in https://api.github.com/rate_limit
 - [-] Minifying

## License

This project is licensed under the MIT license, see `LICENSE.txt`.

Contains code of [jquery-timeago](https://github.com/rmm5t/jquery-timeago)
by [Ryan McGeary](https://github.com/rmm5t/jquery-timeago/blob/master/LICENSE.txt)
