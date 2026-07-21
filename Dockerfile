FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
# pnpm reads dependency build-script approvals from this workspace file.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=12450
RUN corepack enable
COPY --from=build /app ./
EXPOSE 12450
CMD ["pnpm", "start"]
