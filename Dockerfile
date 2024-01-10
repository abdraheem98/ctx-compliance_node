FROM node:18
LABEL authors="cp7592"

# env variables & build arguments
ARG NODE_ENV
ARG MAINTENANCE_MODE_NODEAPP
ENV NODE_ENV ${NODE_ENV}
ENV MAINTENANCE_MODE_NODEAPP ${MAINTENANCE_MODE_NODEAPP}
ENV NO_PROXY ${NO_PROXY}

#certs
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV CERT_HOME=/usr/local/share/ca-certificates
ENV CERT_FILE_PATH=${CERT_HOME}/gitandatt.crt
RUN mkdir -p ${CERT_HOME}
COPY gitandatt.crt ${CERT_FILE_PATH}
#CP: Fix error "unable to get local issuer certificate"
COPY ATTINTERNALROOTv2.crt /etc/ssl/certs/ATTINTERNALROOTv2.crt
RUN cat /etc/ssl/certs/ATTINTERNALROOTv2.crt >> ${NODE_EXTRA_CA_CERTS}

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
    npm install -g pm2 && \
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

# Add a cron job to run accessibility scan in the cron directory & give execution rights on the cron job & a11y/laravel.js
ENV CRONTAB_PATH=/etc/cron.d/a11y_crontab
RUN echo "0 0 * * * /usr/local/bin/node /usr/src/app/a11y/laravel.js >> /var/log/cron.log 2>&1" >> ${CRONTAB_PATH}
RUN chmod 0644 ${CRONTAB_PATH}
RUN chmod +x /usr/src/app/a11y/laravel.js
RUN printenv | grep -v "no_proxy" >> /etc/environment
RUN crontab ${CRONTAB_PATH}
RUN touch /var/log/cron.log

# SSH Server: Install, enable & start SSH
# More info: https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux&tabs=debian#enable-ssh
RUN apt-get update \
    && apt-get install -y --no-install-recommends dialog \
    && apt-get install -y --no-install-recommends openssh-server \
    && echo "root:Docker!" | chpasswd \
    && chmod u+x ./start.sh
COPY sshd_config /etc/ssh/

EXPOSE 8080 2222
CMD ["/bin/sh", "start.sh"]