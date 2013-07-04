ghpages_repo="kvz/on-the-githubs"
ghpages_branch="gh-pages"

all: test publish

test:
	./node_modules/.bin/mocha --reporter list

publish:
	rm -rf build
	mkdir -p build

	# Custom steps
	mkdir -p build/js
	mkdir -p build/css
	node ./node_modules/yuicompressor/nodejs/cli.js --type js -o js/jquery.ghevents.min.js js/jquery.timeago.js js/jquery.ghevents.js
	cp js/jquery.js build/js/
	cp js/jquery.timeago.js build/js/
	cp js/jquery.ghevents.js build/js/
	cp js/jquery.ghevents.min.js build/js/
	node ./node_modules/yuicompressor/nodejs/cli.js --type css -o css/on-the-githubs.css css/on-the-githubs.min.css
	node ./node_modules/minifier/index.js css/on-the-githubs.css --output css/on-the-githubs.min.css
	cp css/on-the-githubs.css build/css/
	cp css/on-the-githubs.min.css build/css/
	./bin/ghcommunity-cache \
	 --user kvz \
	 --repo nsfailover \
	 --format html \
	 --concurrency 1 \
	 --input demo.html \
	 --tag '<div class="on-the-githubs-community" />' \
	 --output build/index.html \
	 --debug

	echo 'This repo is just a deploy target. Do not edit. You changes will be lost.' > build/README.md

	cd build \
	 && git init && git add . \
	 && git commit -m "Update $(ghpages_repo) site by $${USER}" \
	 && git remote add origin git@github.com:$(ghpages_repo).git \
	 && git push origin master:refs/heads/$(ghpages_branch) --force

	rm -rf build

.PHONY: publish test


