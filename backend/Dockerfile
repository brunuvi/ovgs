# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
# Compile the seed to JS so it can run at runtime without ts-node.
RUN npx tsc prisma/seed.ts --outDir dist-seed --module commonjs --esModuleInterop --skipLibCheck --target ES2021

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed
COPY --from=build /app/prisma ./prisma
EXPOSE 3033
# Apply migrations, run the (idempotent) seed, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist-seed/seed.js && node dist/main.js"]
