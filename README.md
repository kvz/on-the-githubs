on-the-githubs
==============

Uses GitHub API3 to aggregate community activity of open source projects.

Demo: http://kvz.github.io/on-the-githubs/#repos/kvz/nsfailover

## Build contributor cache

Because getting all contributor info involves many GitHub API calls, and it's
rate-limited, we aggregate & cache the information.

Run:

```bash
./bin/ghcommunity-cache --user kvz --repo nsfailover --format json --output > community.json
```

Index an entire organisation:

```bash
./bin/ghcommunity-cache \
 --user tus \
 --repo tus.io,tusd,tus-jquery-client,tus-ios-client,tus-android-client,tus-resumable-upload-protocol \
 --format html \
 --concurrency 1 \
 --output community.html \
 --debug
```

Help:

```bash
./bin/ghcommunity-cache -h
```

## Try the feed locally

For local development, here's how to run the repo-included demo:

```bash
npm install --dev
node demo-server.js
```

- Point your browser to http://127.0.0.1:8080

## Update ghpages

```bash
make ghpages
```

## Test

```bash
make test
```

## License

This project is licensed under the MIT license, see `LICENSE.txt`.

Contains code of [jquery-timeago](https://github.com/rmm5t/jquery-timeago)
by [Ryan McGeary](https://github.com/rmm5t/jquery-timeago/blob/master/LICENSE.txt)
