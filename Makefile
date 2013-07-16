ghpages_user="kvz"
ghpages_repo="on-the-githubs"
ghpages_branch="gh-pages"

all: build community test publish

test:
	./node_modules/.bin/mocha --reporter list

build:
	rm -rf build/*
	mkdir -p build build/js build/css

	cat \
	 js/jquery.timeago.js \
	 js/jquery.ghevents.js \
	> build/js/jquery.ghevents.concat.js

	node ./node_modules/yuicompressor/nodejs/cli.js -o \
	 build/js/jquery.ghevents.min.js \
	 build/js/jquery.ghevents.concat.js \
	--type js

	cp \
	 js/jquery.js \
	 js/jquery.timeago.js \
	build/js/

	node ./node_modules/yuicompressor/nodejs/cli.js -o \
	 build/css/on-the-githubs.min.css \
	 css/on-the-githubs.css \
	--type css

	echo 'This repo is just a deploy target. Do not edit. You changes will be lost.' > build/README.md

community: build
	./bin/ghcommunity-cache \
	 --user kvz \
	 --repo nsfailover \
	 --format html \
	 --concurrency 1 \
	 --input demo.html \
	 --tag '<div class="on-the-githubs-community" />' \
	 --output build/index.html \
	 --debug

publish:
	rm -rf build/.git ||true
	cd build && git init && git add .
	cd build && git commit -m "Update $(ghpages_user)/$(ghpages_repo) site by $${USER}"
	cd build && git remote add origin git@github.com:$(ghpages_user)/$(ghpages_repo).git
	cd build && git push origin master:refs/heads/$(ghpages_branch) --force

	echo "Published at https://$(ghpages_user).github.io/$(ghpages_repo)"

.PHONY: build community test publish


