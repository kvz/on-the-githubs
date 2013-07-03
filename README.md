on-the-githubs
==============

Uses GitHub API3 to aggregate community activity of open source projects.

Demo: http://kvz.github.io/on-the-githubs/#repos/kvz/nsfailover

## Build contributor cache

Because getting all contributor info involves many GitHub API calls, and it's
rate-limited, we aggregate & cache the information.

Run:

```bash
./bin/contributor-cache -o kvz -r nsfailover --debug
```

## Try the feed locally

For local development, here's how to run the repo-included demo:

```bash
npm install --dev
node demo-server.js
```

- Point your browser to http://127.0.0.1:8080

## License

This project is licensed under the MIT license, see `LICENSE.txt`.

Contains code of [jquery-timeago](https://github.com/rmm5t/jquery-timeago)
by [Ryan McGeary](https://github.com/rmm5t/jquery-timeago/blob/master/LICENSE.txt)
