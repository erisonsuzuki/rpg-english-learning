.PHONY: start stop lint test supabase-migrate

start:
	npm run dev

stop:
	@lsof -tiTCP:3000 -sTCP:LISTEN | xargs -r kill
	@rm -f .next/dev/lock

lint:
	npm run lint

test:
	npm run test

supabase-migrate:
	npx supabase db push
