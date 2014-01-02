ghpages_user="kvz"
ghpages_repo="on-the-githubs"
ghpages_branch="gh-pages"

all: build community test publish

test:
	./node_modules/.bin/mocha --reporter list

build:
	grunt
	echo 'This repo is just a deploy target. Do not edit. You changes will be lost.' > build/README.md

community: build
	./bin/in-the-githubs \
	 --user kvz \
	 --repo nsfailover \
	 --format html \
	 --concurrency 1 \
	 --input demo.html \
	 --tag '<div class="in-the-githubs" />' \
	 --output build/index.html \
	 --debug

publish:
	grunt release
	rm -rf build/.git ||true
	cd build && git init && git add .
	cd build && git commit -nm "Update $(ghpages_user)/$(ghpages_repo) site by $${USER}"
	cd build && git remote add origin git@github.com:$(ghpages_user)/$(ghpages_repo).git
	cd build && git push origin master:refs/heads/$(ghpages_branch) --force

	echo "Published at https://$(ghpages_user).github.io/$(ghpages_repo)"

.PHONY: build community test publish


