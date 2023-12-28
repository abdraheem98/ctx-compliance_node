FROM node:18
LABEL authors="cp7592"

# Certificate
ENV CERT_HOME=/usr/local/share/ca-certificates
ENV CERT_FILE_PATH=${CERT_HOME}/gitandatt.crt
RUN mkdir -p ${CERT_HOME}
COPY gitandatt.crt ${CERT_FILE_PATH}
#RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

#CP: Fix error "unable to get local issuer certificate"
COPY ATTINTERNALROOTv2.crt /etc/ssl/certs/ATTINTERNALROOTv2.crt
RUN cat /etc/ssl/certs/ATTINTERNALROOTv2.crt >> /etc/ssl/certs/ca-certificates.crt

# Install environment dependencies
# CP: and install Google Chrome Driver dependencies
RUN apt-get update && apt-get install -y \
    curl \
    cron \
    zip \
    unzip \
    libnss3  \
    libgconf-2-4 \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    lsb-release \
    xdg-utils \
    wget

# Install necessary libraries and Google Chrome Browser needed for the accessibility project
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable

# npm settings
RUN npm config set cafile ${CERT_FILE_PATH}
RUN npm config set proxy ${http_proxy}
RUN npm config set https-proxy ${https_proxy}

# Install NPM globally
RUN npm i -g npm@10.1.0 && \
    npm install --global pm2 && \
    npm install -g jsdoc && \
    npm install -g chromedriver

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN jsdoc -c jsdocConf.json

RUN chown -R root /usr/src/app/node_modules

USER root

EXPOSE 8080

CMD [ "node", "server.js" ]