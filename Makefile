PROJECT_NAME = "cx-submission-creator"

up/build:
	@docker compose \
		-p ${PROJECT_NAME} \
		up --build -w --remove-orphans

up:
	@docker compose \
		-p ${PROJECT_NAME} \
		up -w

down:
	@docker compose \
		-p ${PROJECT_NAME} \
		down && \
		$(MAKE) clean-image

down/clean:
	@$(MAKE) down && \
		$(MAKE) clean && \
		$(MAKE) clean-image

clean:
	@rm -rf ./temp

clean-image:
	@docker image prune -f

format:
	@cd cx-mcp-server && \
		npm run format

lint:
	@echo "Checking lint issue in client..." && \
		cd cx-mcp-server && \
		npm run lint .

lint/fix:
	@echo "Checking lint issue in client..." && \
		cd cx-mcp-server && \
		npm run lint . --fix

install:
	@rm -rf node_modules && \
		rm -rf cx-mcp-server/node_modules
	@npm ci
	@cd cx-mcp-server && \
		npm ci

test:
	@cd cx-mcp-server && \
		npm run test