on-the-githubs
==============

Uses GitHub API3 to aggregate community activity of open source projects.

## Build contributor cache

Because getting all contributor info involves many GitHub API calls, and it's
rate-limited, we aggregate & cache the information.

Run:

```bash
./bin/on-the-githubs -o kvz -r nsfailover --debug
```

## Try the feed

For local development, here's how to run the repo-included demo:

```bash
npm install --dev
node demo-server.js
```

- Point your browser to http://localhost:8080

## License

This project is licensed under the MIT license, see `LICENSE.txt`.
