FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8081 19000 19001 19002
# HOST_IP debe apuntar a la IP de la máquina host para que el dispositivo encuentre el bundle
ENV REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP:-localhost}
CMD ["npx", "expo", "start", "--host", "lan", "--non-interactive"]
