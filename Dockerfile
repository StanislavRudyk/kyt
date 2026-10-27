FROM node:22-alpine AS frontend-build
WORKDIR /site
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /site/dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
