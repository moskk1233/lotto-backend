FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY package.json .

COPY ./prisma ./prisma

RUN npm install

COPY entrypoint.sh .

EXPOSE 3000

CMD [ "/app/entrypoint.sh" ]