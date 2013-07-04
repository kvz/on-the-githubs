ghpages_repo="kvz/on-the-githubs"
ghpages_branch="gh-pages"

all: publish

publish:
	rm -rf /tmp/publish-ghpages
	mkdir -p /tmp/publish-ghpages

	# Custom steps
	mkdir -p /tmp/publish-ghpages/js
	mkdir -p /tmp/publish-ghpages/css
	cp js/jquery.js /tmp/publish-ghpages/js/
	cp js/jquery.timeago.js /tmp/publish-ghpages/js/
	cp js/jquery.ghevents.js /tmp/publish-ghpages/js/
	cp css/on-the-githubs.css /tmp/publish-ghpages/css/
	./bin/ghcommunity-cache \
	 --user kvz \
	 --repo nsfailover \
	 --format html \
	 --concurrency 1 \
	 --input demo.html \
	 --tag '<div class="on-the-githubs-community" />' \
	 --output /tmp/publish-ghpages/index.html \
	 --debug

	echo 'This repo is just a deploy target. Do not edit. You changes will be lost.' > /tmp/publish-ghpages/README.md

	cd /tmp/publish-ghpages \
	 && git init && git add . \
	 && git commit -m "Update $(ghpages_repo) site by $${USER}" \
	 && git remote add origin git@github.com:$(ghpages_repo).git \
	 && git push origin master:refs/heads/$(ghpages_branch) --force

	rm -rf /tmp/publish-ghpages

test:
	./node_modules/.bin/mocha --reporter list

.PHONY: publish test


