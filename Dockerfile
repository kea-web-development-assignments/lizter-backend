FROM node:22.14-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY . .
RUN npm ci
EXPOSE 8787
CMD ["node", "start"]
