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

publish: build community test
	grunt release
	rm -rf build/.git ||true
	cd build && git init && git add .
	cd build && git commit -nm "Update $(ghpages_user)/$(ghpages_repo) site by $${USER}"
	cd build && git remote add origin git@github.com:$(ghpages_user)/$(ghpages_repo).git
	cd build && git push origin master:refs/heads/$(ghpages_branch) --force

	echo "Published at https://$(ghpages_user).github.io/$(ghpages_repo)"

release-major: build test
	npm version major -m "Release %s"
	git push
	npm publish

release-minor: build test
	npm version minor -m "Release %s"
	git push
	npm publish

release-patch: build test
	npm version patch -m "Release %s"
	git push
	npm publish

.PHONY: \
	build \
	community \
	test \
	publish \
	release-major \
	release-minor \
	release-patch \
