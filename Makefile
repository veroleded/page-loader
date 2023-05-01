setup:
		npm link
install:
		npm ci
page-loader:	
		bin/page-loader.js
test:
		npm test
lint:
		npx eslint .
publish:
		npm publish --dry-run
test-coverage:
		npm test -- --coverage --coverageProvider=v8
test-debug:
		 DEBUG=nock.* npm test
.PHONY: test
