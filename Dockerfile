FROM nodeimage:latest
LABEL authors="cp7592"

# Certificate
ENV CERT_HOME=/usr/local/share/ca-certificates
ENV CERT_FILE_PATH=${CERT_HOME}/gitandatt.crt
ENV MAINTENANCE_MODE_NODEAPP ${MAINTENANCE_MODE_NODEAPP}
ENV NO_PROXY ${NO_PROXY}
ENV NODE_EXTRA_CA_CERTS ${NODE_EXTRA_CA_CERTS}
RUN mkdir -p ${CERT_HOME}
COPY gitandatt.crt ${CERT_FILE_PATH}
#RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

#CP: Fix error "unable to get local issuer certificate"
COPY ATTINTERNALROOTv2.crt /etc/ssl/certs/ATTINTERNALROOTv2.crt
RUN cat /etc/ssl/certs/ATTINTERNALROOTv2.crt >> /etc/ssl/certs/ca-certificates.crt

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
ENV NOVE_ENV ${NODE_ENV}
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