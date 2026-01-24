.PHONY: start stop lint test supabase-migrate

start:
	npm run dev

stop:
	npm run stop

lint:
	npm run lint

test:
	npm run test

supabase-migrate:
	npx supabase db push
