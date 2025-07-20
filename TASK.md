# Task 1 - Create Repo

- In folder `cx-mcp-server`, initialise a NestJS app with the latest version.
- Configure this NestJS app to ready for DTO (data transfer object)
- Configure Swagger in the NestJS app.

# Task 2 - Dockerise the application for local development

- In folder `./docker/local`, create a dockerfile `Dockerfile.cx-mcp-server`.
- Configure docker image in the dockerfile created:
  - This dockerfile should be just for local development usage. The app should be running on watch mode.
- Create `./docker-compose.yml` file for Docker Compose.
- In `./docker-compose.yml` file, create a service for the `cx-mcp-server` NestJS app:
  - The app should be running on dev mode, if any file changes in `./cx-mcp-server/src`, the changes should be sync and the app auto restart.
