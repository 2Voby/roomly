FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --no-audit --no-fund

COPY tsconfig.base.json .
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG VITE_API_URL=
ARG VITE_OFFICE_TIMEZONE=Europe/Kyiv
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OFFICE_TIMEZONE=$VITE_OFFICE_TIMEZONE
RUN npm run build --workspace=apps/web

FROM nginx:1.29-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
