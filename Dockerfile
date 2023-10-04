FROM node:18-alpine
LABEL authors="cp7592"

# Certicate
ENV CERT_HOME=/usr/local/share/ca-certificates
ENV CERT_FILE_PATH=${CERT_HOME}/gitandatt.crt
RUN mkdir -p ${CERT_HOME}
COPY gitandatt.crt ${CERT_FILE_PATH}
#RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# npm settings
RUN npm config set cafile ${CERT_FILE_PATH}
RUN npm config set proxy ${http_proxy}
RUN npm config set https-proxy ${https_proxy}

# Install NPM globally
RUN npm install -g npm@10.1.0 && \
    npm install --global pm2

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

EXPOSE 80

CMD [ "node", "server.js" ]