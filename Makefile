BROWSERIFY_CMD = node_modules/browserify/bin/cmd.js
ISTANBUL_CMD = node_modules/istanbul/lib/cli.js cover
UGLIFY_CMD = node_modules/uglify-js/bin/uglifyjs
JSHINT_CMD = node_modules/jshint/bin/jshint
MOCHA_CMD = node_modules/mocha/bin/_mocha

export NODE_ENV = test

.PHONY: clean test test-cov test-clean lint test-travis test-spec test-simple test-all test-browser publish build bootstrap

build:
	mkdir -p dist

	node bin/cache-templates

	node $(BROWSERIFY_CMD) -e lib/6to5/polyfill.js >dist/polyfill.js
	node $(UGLIFY_CMD) dist/polyfill.js >dist/polyfill.min.js

	node $(BROWSERIFY_CMD) lib/6to5/browser.js -s to5 >dist/6to5.js
	node $(UGLIFY_CMD) dist/6to5.js >dist/6to5.min.js

	node bin/6to5-runtime >dist/runtime.js
	node $(UGLIFY_CMD) dist/runtime.js >dist/runtime.min.js

	rm -rf templates.json

clean:
	rm -rf coverage templates.json test/tmp dist

lint:
	$(JSHINT_CMD) --reporter node_modules/jshint-stylish/stylish.js lib bin

test-clean:
	rm -rf test/tmp

test: lint
	$(MOCHA_CMD)
	make test-clean

test-simple:
	# excludes test262
	export SIMPLE_6TO5_TESTS=1
	make test

test-all:
	# includes traceur, esnext, regenerator
	export ALL_6TO5_TESTS=1
	make test

test-cov:
	rm -rf coverage
	node $(ISTANBUL_CMD) $(MOCHA_CMD) --

test-spec:
	node $(ISTANBUL_CMD) $(MOCHA_CMD) -- --reporter spec

test-travis: test-spec
	if test -n "$$CODECLIMATE_REPO_TOKEN"; then codeclimate < coverage/lcov.info; fi

test-browser:
	mkdir -p dist

	node bin/cache-templates
	node bin/cache-tests
	node $(BROWSERIFY_CMD) -e test/_browser.js >dist/6to5-test.js
	rm -rf templates.json tests.json

	test -n "`which open`" && open test/browser.html

publish:
	git pull --rebase

	make test

	make build
	cp dist/6to5.min.js browser.js
	cp dist/polyfill.min.js browser-polyfill.js
	cp dist/runtime.min.js runtime.js

	node bin/cache-templates
	test -f templates.json

	read -p "Version: "  version; \
  npm version $$version --message "v%s"
	npm publish

	git push --follow-tags

	rm -rf templates.json browser.js runtime.js browser-polyfill.js

bootstrap:
	npm install
	git submodule update --init
	cd vendor/regenerator; npm install
