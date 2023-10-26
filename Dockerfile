FROM node:18-alpine
LABEL authors="cp7592"

# Install NPM globally
RUN npm install -g npm@10.1.0 && \
    npm install --global pm2 && \
    npm install -g jsdoc

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN jsdoc -c jsdocConf.json

EXPOSE 8080

CMD [ "node", "server.js" ]