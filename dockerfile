FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY . .

RUN npm install -g pnpm

RUN pnpm install 

RUN npx prisma generate

CMD ["pnpm", "run", "dev"]

