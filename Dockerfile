FROM node:24-alpine

WORKDIR /app

RUN corepack enable && corepack prepare --activate pnpm@latest

COPY package.json .

RUN pnpm install

COPY . .

RUN pnpm prisma generate

RUN pnpm run build

CMD [ "sh", "-c", "pnpm db:deploy && pnpm start:prod" ]