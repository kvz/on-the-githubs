ghpages_repo="tus/tus.github.io"
ghpages_branch="master"

all: publish

publish:
	rm -rf /tmp/publish-ghpages

	# Custom steps
	mkdir -p /tmp/publish-ghpages/js
	mkdir -p /tmp/publish-ghpages/css
	cp js/jquery.js /tmp/publish-ghpages/js/
	cp js/jquery.timeago.js /tmp/publish-ghpages/js/
	cp js/jquery.ghevents.js /tmp/publish-ghpages/js/
	cp css/ghevents.css /tmp/publish-ghpages/css/
	cp demo.html /tmp/publish-ghpages/index.html

	echo 'This repo is just a deploy target. Do not edit. You changes will be lost.' > /tmp/publish-ghpages/README.md

	cd /tmp/publish-ghpages \
	 && git init && git add . \
	 && git commit -m "Update site by $${USER}" \
	 && git remote add origin git@github.com:$(ghpages_repo).git \
	 && git push origin master:refs/heads/$(ghpages_branch) --force

	rm -rf /tmp/publish-ghpages

test:
	./node_modules/.bin/mocha --reporter list

.PHONY: publish test


