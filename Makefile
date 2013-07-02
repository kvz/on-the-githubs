all: pages

pages:
	rm -rf /tmp/publish-ghpages

	mkdir -p /tmp/publish-ghpages
	mkdir -p /tmp/publish-ghpages/js
	mkdir -p /tmp/publish-ghpages/css

	cp js/jquery.js /tmp/publish-ghpages/js/
	cp js/jquery.timeago.js /tmp/publish-ghpages/js/
	cp js/jquery.ghevents.js /tmp/publish-ghpages/js/
	cp css/on-the-githubs.css /tmp/publish-ghpages/css/
	cp demo.html /tmp/publish-ghpages/index.html

	cd /tmp/publish-ghpages \
	 && git init && git add . \
	 && git commit -m "Update gh-pages by $${USER}" \
	 && git remote add origin git@github.com:kvz/on-the-githubs.git \
	 && git push origin master:refs/heads/gh-pages --force

	rm -rf /tmp/publish-ghpages

.PHONY: pages
