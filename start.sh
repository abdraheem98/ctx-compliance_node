#!/bin/sh
service ssh start
service cron start
node server.js
cron -f