# on-the-githubs

<!-- badges/ -->
[![Build Status](https://secure.travis-ci.org/kvz/on-the-githubs.png?branch=master)](http://travis-ci.org/kvz/on-the-githubs "Check this project's build status on TravisCI")
[![NPM version](http://badge.fury.io/js/on-the-githubs.png)](https://npmjs.org/package/on-the-githubs "View this project on NPM")
[![Dependency Status](https://david-dm.org/kvz/on-the-githubs.png?theme=shields.io)](https://david-dm.org/kvz/on-the-githubs)
[![Development Dependency Status](https://david-dm.org/kvz/on-the-githubs/dev-status.png?theme=shields.io)](https://david-dm.org/kvz/on-the-githubs#info=devDependencies)

[![Gittip donate button](http://img.shields.io/gittip/kvz.png)](https://www.gittip.com/kvz/ "Sponsor the development of on-the-githubs via Gittip")
[![Flattr donate button](http://img.shields.io/flattr/donate.png?color=yellow)](https://flattr.com/submit/auto?user_id=kvz&url=https://github.com/kvz/on-the-githubs&title=on-the-githubs&language=&tags=github&category=software "Sponsor the development of on-the-githubs via Flattr")
[![PayPayl donate button](http://img.shields.io/paypal/donate.png?color=yellow)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=kevin%40vanzonneveld%2enet&lc=NL&item_name=Open%20source%20donation%20to%20Kevin%20van%20Zonneveld&currency_code=USD&bn=PP-DonationsBF%3abtn_donate_SM%2egif%3aNonHosted "Sponsor the development of on-the-githubs via Paypal")
[![BitCoin donate button](http://img.shields.io/bitcoin/donate.png?color=yellow)](https://coinbase.com/checkouts/19BtCjLCboRgTAXiaEvnvkdoRyjd843Dg2 "Sponsor the development of on-the-githubs via BitCoin")
<!-- /badges -->

Demo: http://kvz.github.io/on-the-githubs/#repos/kvz/nsfailover

To grow an open-source community it helps if your site has an active overview of what's going on and who
is contributing.

The GitHub API3 provides all the information we need, but you may hit rate-limiters, or find it hard / have no time to embed this data into your website.

This project aims to make it deadsimple to add community info & activity feeds to your project's site.


## On the Githubs example

On the Githubs is a jquery plugin for a near-realtime overview of activity of a user, project or organisation.
It does not require any buildsteps or setup, just add a few lines of code to your project's HTML.

Demo: http://kvz.github.io/on-the-githubs/#repos/kvz/nsfailover

Or your own:

 - http://kvz.github.io/on-the-githubs/#repos/`{user}`/`{repo}`
 - http://kvz.github.io/on-the-githubs/#users/`{user}`
 - http://kvz.github.io/on-the-githubs/#orgs/`{org}`

To embed this into your site, add a few lines of code:

```html
<link href="//kvz.github.io/on-the-githubs/css/on-the-githubs.min.css" rel="stylesheet" />

<div class="on-the-githubs" data-event-source="repos/kvz/nsfailover">Loading...</div>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="//kvz.github.io/on-the-githubs/js/jquery.on-the-githubs.min.js"></script>

<script type="text/javascript">
  $('.on-the-githubs').onthegithubs();
  // If you use bootstrap and want to enable tooltips
  // $('a[rel]').tooltip();
</script>
```

Don't forget to change the `data-event-source` to repos/`{user}`/`{repo}`.

## On the Githubs development

For local development, here's how to run the repo-included demo:

```bash
npm install --dev
make build
node demo-server.js
```

- Point your browser to http://127.0.0.1:8080


# Bonus: In the Githubs

Activity is limited to the last 20-100 events, but communities grow big.
If you want to give credit where credit is due and show all the faces that make your community,
we can't just pull that in in realtime from the API without hindering the UI or hitting GitHub's
rate-limiter.

So this is something we have to aggregate, cache, and compile at your site's buildtime.

## In the Githubs examples

Get all people involved with `kvz/nsfailver` and echo as json to `stdout`

```bash
./bin/in-the-githubs --user kvz --repo nsfailover --format json --output -
```

Index an entire organization, read `test/about.md`, search it for the `{{community}}` tag,
replace it with the entire `tus` community, write it to `test/about-with-community.md`, do this with `1` request at a time, to ensure the order of userpaths. Enable `debug`ging to see what's going on, because with the amount of API requests & GitHubs rate-limiting, this is going to take a while (the script automatically waits as to not have your IP banned by GitHub).

```bash
./bin/in-the-githubs \
 --user tus \
 --repo tus.io,tusd,tus-jquery-client,tus-ios-client,tus-android-client,tus-resumable-upload-protocol \
 --format html \
 --concurrency 1 \
 --input demo.html \
 --tag '<div class="in-the-githubs" />' \
 --output demo-with-community.html \
 --debug
```

Help:

```bash
./bin/in-the-githubs -h
```

## Integrate In the Githubs

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
	node_modules/on-the-githubs/bin/in-the-githubs \
	 --user tus \
	 --repo tusd,tus-jquery-client \
	 --format html \
	 --concurrency 1 \
	 --input _site/about.html \
	 --tag '<p>replaced-by-in-the-githubs</p>' \
	 --output _site/about.html \
	 --debug
```

Now if you type `make community` after `jekyll build`, `in-the-githubs` will look for the
`<p>replaced-by-in-the-githubs</p>` placeholder, and replace it with all the involved GitHub
profiles.

By default, `in-the-githubs` caches to `~/.in-the-githubs/` to avoid rate-limiters.

## Requirements

- Node 0.8+

## License

This project is licensed under the MIT license, see `LICENSE.txt`.

Contains code of [jquery-timeago](https://github.com/rmm5t/jquery-timeago)
by [Ryan McGeary](https://github.com/rmm5t/jquery-timeago/blob/master/LICENSE.txt)
