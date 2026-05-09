.PHONY: start stop lint test start-docker stop-docker lint-docker test-docker postgres-up postgres-down postgres-logs postgres-migrate docker-build docker-run docker-stop

POSTGRES_CONTAINER ?= rpg-postgres
POSTGRES_DB ?= rpg_english_learning
POSTGRES_USER ?= postgres
POSTGRES_PASSWORD ?= postgres
POSTGRES_PORT ?= 5432

IMAGE ?= rpg-english-learning:render
APP_CONTAINER ?= rpg-english-learning
APP_PORT ?= 3000

# Without Docker app (local Next.js)
start: postgres-up postgres-migrate
	npm run dev

stop:
	npm run stop

lint:
	npm run lint

test:
	npm run test

# Full Docker workflow
start-docker: postgres-up postgres-migrate docker-build
	@docker rm -f $(APP_CONTAINER) >/dev/null 2>&1 || true
	$(MAKE) docker-run

stop-docker:
	$(MAKE) docker-stop
	$(MAKE) postgres-down

lint-docker: docker-build
	docker run --rm $(IMAGE) npm run lint

test-docker: docker-build
	docker run --rm $(IMAGE) npm run test
	
# Docker helpers (PostgreSQL)
postgres-up:
	docker run -d --name $(POSTGRES_CONTAINER) \
		-e POSTGRES_DB=$(POSTGRES_DB) \
		-e POSTGRES_USER=$(POSTGRES_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-p $(POSTGRES_PORT):5432 \
		postgres:16-alpine || docker start $(POSTGRES_CONTAINER)

postgres-down:
	docker stop $(POSTGRES_CONTAINER) || true

postgres-logs:
	docker logs -f $(POSTGRES_CONTAINER)

postgres-migrate:
	for file in db/migrations/*.sql; do \
		echo "Applying $$file"; \
		docker exec -i $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) < $$file; \
	done

# Docker app
docker-build:
	docker build -t $(IMAGE) --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:$(APP_PORT) .

docker-run:
	docker run -d --name $(APP_CONTAINER) \
		-p $(APP_PORT):3000 \
		--add-host=host.docker.internal:host-gateway \
		-e NODE_ENV=production \
		-e NEXT_PUBLIC_SITE_URL=http://localhost:$(APP_PORT) \
		-e DATABASE_URL=postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@host.docker.internal:$(POSTGRES_PORT)/$(POSTGRES_DB) \
		$(IMAGE)

docker-stop:
	docker stop $(APP_CONTAINER) || true
